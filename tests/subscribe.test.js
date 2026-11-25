import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/subscribe.js';

const oldFetch=globalThis.fetch;
const env=()=>({RESEND_API_KEY:'test',PLS_RESEND_SEGMENT_ID:'segment-test',PLS_SIGNUP_RATE_LIMIT:{async get(){return null},async put(){}}});
const req=(body,origin='https://pls.pages.dev')=>new Request('https://pls.pages.dev/api/subscribe',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('adds a subscriber to the PLS segment without leaking the API key',async()=>{const calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response('{}',{status:200})};try{const result=await onRequestPost({request:req({email:' USER@Example.com ',website:''}),env:env()});assert.equal(result.status,200);assert.equal(calls.length,2);assert.equal(JSON.parse(calls[0].options.body).email,'user@example.com');assert.match(calls[1].url,/segments\/segment-test$/);assert.doesNotMatch(await result.text(),/test/)}finally{globalThis.fetch=oldFetch}});
test('handles existing subscribers and rejects foreign origins',async()=>{let called=0;globalThis.fetch=async()=>{called++;return new Response('{}',{status:called===1?409:200})};try{assert.equal((await onRequestPost({request:req({email:'a@example.com',website:''}),env:env()})).status,200);assert.equal(called,2);assert.equal((await onRequestPost({request:req({email:'b@example.com',website:''},'https://evil.example'),env:env()})).status,403);assert.equal(called,2)}finally{globalThis.fetch=oldFetch}});
test('fails visibly if Resend fails, without claiming the signup succeeded',async()=>{globalThis.fetch=async()=>new Response('{}',{status:401});try{assert.equal((await onRequestPost({request:req({email:'a@example.com',website:''}),env:env()})).status,502)}finally{globalThis.fetch=oldFetch}});
