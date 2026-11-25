// Cloudflare Pages Function: subscribe one email to the PLS Resend segment.
// Keep the API key and segment ID in Pages environment variables, never in Git.
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
async function digest(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}

export async function onRequestPost({request,env}){
  if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return json({error:'invalid_request'},415);
  if(Number(request.headers.get('content-length')||0)>2048)return json({error:'invalid_request'},413);
  const origin=request.headers.get('Origin');
  if(origin){let parsed;try{parsed=new URL(origin)}catch{return json({error:'invalid_origin'},403)}if(parsed.origin!==new URL(request.url).origin)return json({error:'invalid_origin'},403)}
  if(!env.RESEND_API_KEY||!env.PLS_RESEND_SEGMENT_ID||!env.PLS_SIGNUP_RATE_LIMIT)return json({error:'service_unavailable'},503);
  let data;try{data=await request.json()}catch{return json({error:'invalid_request'},400)}
  if(typeof data.email!=='string'||data.email.length>254||typeof data.website!=='string'||data.website.length>200)return json({error:'invalid_request'},400);
  if(data.website.trim())return json({ok:true}); // Honeypot for automated submissions.
  const email=data.email.trim().toLowerCase();
  if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))return json({error:'invalid_email'},400);
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const ipKey=`ip:${await digest(ip)}`;const emailKey=`email:${await digest(email)}`;
  try{
    if(await env.PLS_SIGNUP_RATE_LIMIT.get(ipKey)||await env.PLS_SIGNUP_RATE_LIMIT.get(emailKey))return json({error:'rate_limited'},429);
    await env.PLS_SIGNUP_RATE_LIMIT.put(ipKey,'1',{expirationTtl:60});
    await env.PLS_SIGNUP_RATE_LIMIT.put(emailKey,'1',{expirationTtl:3600});
    const headers={Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'};
    const created=await fetch('https://api.resend.com/contacts',{method:'POST',headers,body:JSON.stringify({email,unsubscribed:false})});
    // Existing subscribers remain unsubscribed if they had opted out; never reactivate them.
    if(!created.ok&&created.status!==409)return json({error:'service_unavailable'},502);
    const segmented=await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(env.PLS_RESEND_SEGMENT_ID)}`,{method:'POST',headers});
    if(!segmented.ok&&segmented.status!==409)return json({error:'service_unavailable'},502);
    return json({ok:true});
  }catch{return json({error:'service_unavailable'},502)}
}
