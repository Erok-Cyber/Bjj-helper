const recoveryKey='grapplelog:password-recovery'
// Read the recovery intent before Supabase consumes and removes the URL fragment.
export const initialPasswordRecovery=new URLSearchParams(window.location.hash.slice(1)).get('type')==='recovery'||sessionStorage.getItem(recoveryKey)==='1'
export const rememberPasswordRecovery=(pending:boolean)=>{
  if(pending)sessionStorage.setItem(recoveryKey,'1')
  else sessionStorage.removeItem(recoveryKey)
}
