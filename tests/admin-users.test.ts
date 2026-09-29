import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { handleAdminUsers } from '../supabase/functions/admin-users/handler.ts'

const request=(body:unknown={action:'list'},token:string|null='valid')=>new Request('https://example.test/admin-users',{
  method:'POST',headers:{...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body),
})
const fixture=(user:any)=>{
  let calls=0
  const auth={getUser:async(token:string)=>({data:{user:token==='valid'?user:null},error:null}),admin:{listUsers:async()=>{
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
