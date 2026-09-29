import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { handleAdminUsers } from '../supabase/functions/admin-users/handler.ts'

const request=(body:unknown={action:'list'},token:string|null='valid')=>new Request('https://example.test/admin-users',{
  method:'POST',headers:{...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body),
})
const fixture=(user:any)=>{
  let calls=0
  const auth={resetPasswordForEmail:async()=>({error:null}),getUser:async(token:string)=>({data:{user:token==='valid'?user:null},error:null}),admin:{getUserById:async()=>({data:{user:null},error:null}),updateUserById:async()=>({data:{user:null},error:null}),listUsers:async()=>{
    calls++;return {data:{users:[{id:'u1',email:'athlete@example.test',created_at:'2026-01-01',user_metadata:{private:'hidden'},app_metadata:{grapplelog_admin:true},encrypted_password:'never-return'}],total:1,lastPage:1},error:null}
  }}}
  return {auth,calls:()=>calls}
}
test('missing and invalid tokens cannot access users',async()=>{
  const f=fixture({id:'admin',app_metadata:{grapplelog_admin:true}})
  for(const token of [null,'invalid'])assert.equal((await handleAdminUsers(request({action:'list'},token),f.auth)).status,401)
  assert.equal(f.calls(),0)
})
test('normal users and user-editable metadata cannot grant access',async()=>{
  for(const user of [{id:'u1'},{id:'u1',user_metadata:{grapplelog_admin:true}},{id:'u1',app_metadata:{grapplelog_admin:'true'}}]){
    const f=fixture(user)
    assert.equal((await handleAdminUsers(request(),f.auth)).status,403)
    assert.deepEqual(await (await handleAdminUsers(request({action:'access'}),f.auth)).json(),{isAdmin:false})
    assert.equal(f.calls(),0)
  }
})
test('admin listing only returns approved fields and is never cached',async()=>{
  const f=fixture({id:'admin',app_metadata:{grapplelog_admin:true}})
  const r=await handleAdminUsers(request(),f.auth),data=await r.json()
  assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store')
  assert.deepEqual(Object.keys(data.users[0]).sort(),['banned','confirmed','createdAt','email','id','isAdmin','lastSignInAt'].sort())
  assert.equal(data.total,1);assert.equal(data.hasMore,false);assert.equal(f.calls(),1)
})
test('revoking server role denies the very next request',async()=>{
  const user={id:'admin',app_metadata:{grapplelog_admin:true}},f=fixture(user)
  assert.equal((await handleAdminUsers(request(),f.auth)).status,200)
  user.app_metadata.grapplelog_admin=false
  assert.equal((await handleAdminUsers(request(),f.auth)).status,403)
  assert.equal(f.calls(),1)
})
test('blocked administrators and invalid pagination are rejected',async()=>{
  const f=fixture({id:'admin',app_metadata:{grapplelog_admin:true},banned_until:'2999-01-01'})
  assert.equal((await handleAdminUsers(request(),f.auth)).status,401)
  const active=fixture({id:'admin',app_metadata:{grapplelog_admin:true}})
  for(const page of [0,-1,1.5,'1',10001])assert.equal((await handleAdminUsers(request({action:'list',page}),active.auth)).status,400)
  assert.equal(active.calls(),0)
})
test('auth outages fail closed without leaking exception content',async()=>{
  const f=fixture(null);f.auth.getUser=async()=>{throw Error('sensitive upstream detail')}
  const r=await handleAdminUsers(request(),f.auth)
  assert.equal(r.status,500);assert.equal((await r.text()).includes('sensitive'),false);assert.equal(f.calls(),0)
})

const adminId='11111111-1111-4111-8111-111111111111'
const targetId='22222222-2222-4222-8222-222222222222'
const actions=['send_reset','set_password','block','unblock']
const managementFixture=()=>{
  const actor:any={id:adminId,app_metadata:{grapplelog_admin:true}}
  const target:any={id:targetId,email:'athlete@example.test',app_metadata:{},email_confirmed_at:'2026-01-01'}
  const calls:any[]=[]
  const auth={
    getUser:async(token:string)=>({data:{user:token==='valid'?actor:null},error:null}),
    resetPasswordForEmail:async(email:string,options:unknown)=>{calls.push({email,options});return {error:null as any}},
    admin:{
      listUsers:async()=>({data:{users:[target]},error:null}),
      getUserById:async(id:string)=>({data:{user:id===targetId?target:null},error:null as any}),
      updateUserById:async(id:string,attributes:any)=>{
        calls.push({id,attributes})
        return {data:{user:{...target,banned_until:attributes.ban_duration==='876000h'?'2999-01-01':null}},error:null as any}
      },
    },
  }
  return {actor,target,auth,calls}
}
const change=(action:string,extra:Record<string,unknown>={})=>request({action,userId:targetId,confirmed:true,password:'Test-password1!',...extra})

test('all management actions require a current administrator and valid session',async()=>{
  for(const action of actions){
    const f=managementFixture()
    assert.equal((await handleAdminUsers(request({action,userId:targetId,confirmed:true},'invalid'),f.auth)).status,401)
    f.actor.app_metadata={};f.actor.user_metadata={grapplelog_admin:true}
    assert.equal((await handleAdminUsers(change(action),f.auth)).status,403)
    assert.equal(f.calls.length,0)
  }
})
test('self and administrator accounts cannot be changed through user management',async()=>{
  for(const action of actions){
    const f=managementFixture()
    assert.equal((await handleAdminUsers(change(action,{userId:adminId}),f.auth)).status,403)
    for(const flag of ['grapplelog_admin','grapplelog_admin_only']){
      f.target.app_metadata={[flag]:true}
      assert.equal((await handleAdminUsers(change(action),f.auth)).status,403)
    }
    assert.equal(f.calls.length,0)
  }
})
test('changes require explicit confirmation and a valid, existing user',async()=>{
  const f=managementFixture()
  for(const extra of [{confirmed:false},{confirmed:'true'},{userId:'invalid'}])assert.equal((await handleAdminUsers(change('block',extra),f.auth)).status,400)
  assert.equal((await handleAdminUsers(change('block',{userId:'33333333-3333-4333-8333-333333333333'}),f.auth)).status,404)
  assert.equal(f.calls.length,0)
})
test('password update forwards only the password and never returns it',async()=>{
  const f=managementFixture(),password='Unit-test-password1!'
  const r=await handleAdminUsers(change('set_password',{password,app_metadata:{grapplelog_admin:true},email:'attacker@example.test'}),f.auth)
  assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store')
  assert.deepEqual(f.calls,[{id:targetId,attributes:{password}}])
  const output=await r.text();assert.equal(output.includes(password),false);assert.equal(output.includes('app_metadata'),false)
  for(const bad of ['', 'short', 'a'.repeat(73), '🥋'.repeat(19), 123, null])assert.equal((await handleAdminUsers(change('set_password',{password:bad}),f.auth)).status,400)
  assert.equal(f.calls.length,1)
})
test('reset email uses the stored address and fixed app redirect',async()=>{
  const f=managementFixture()
  const r=await handleAdminUsers(change('send_reset',{email:'attacker@example.test',redirectTo:'https://attacker.example'}),f.auth)
  assert.equal(r.status,200)
  assert.deepEqual(f.calls,[{email:'athlete@example.test',options:{redirectTo:'https://erok-cyber.github.io/Bjj-helper/'}}])
  f.target.banned_until='2999-01-01'
  assert.equal((await handleAdminUsers(change('send_reset'),f.auth)).status,409)
  assert.equal(f.calls.length,1)
})
test('block and unblock use explicit safe durations without changing other fields',async()=>{
  const f=managementFixture()
  for(const action of ['block','unblock']){
    const r=await handleAdminUsers(change(action,{ban_duration:'none',app_metadata:{grapplelog_admin:true}}),f.auth)
    assert.equal(r.status,200);assert.equal((await r.json()).user.banned,action==='block')
  }
  assert.deepEqual(f.calls,[{id:targetId,attributes:{ban_duration:'876000h'}},{id:targetId,attributes:{ban_duration:'none'}}])
})
test('upstream failures and rate limits never report successful changes or leak secrets',async()=>{
  const f=managementFixture()
  f.auth.admin.updateUserById=async()=>({data:{user:null},error:{message:'sensitive password detail'}})
  const r=await handleAdminUsers(change('set_password'),f.auth)
  assert.equal(r.status,502);assert.equal((await r.text()).includes('sensitive'),false)
  f.auth.resetPasswordForEmail=async()=>({error:{status:429,message:'sensitive'}})
  assert.equal((await handleAdminUsers(change('send_reset'),f.auth)).status,429)
  f.actor.app_metadata.grapplelog_admin=false
  assert.equal((await handleAdminUsers(change('unblock'),f.auth)).status,403)
})
