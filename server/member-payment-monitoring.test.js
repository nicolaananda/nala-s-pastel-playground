import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import {memberNotification} from './member-routes.js';

const key='monitoring-test-key';
const signed=orderId=>{const notification={order_id:orderId,status_code:'200',gross_amount:'15000'};notification.signature_key=crypto.createHash('sha512').update(`${orderId}20015000${key}`).digest('hex');return notification};

test('records verified settlement incidents without recording normal pending states',async()=>{
 const incidents=[],store={setOrderState:async()=>{}};
 let result=await memberNotification({store,serverKey:key,notification:signed('MEMBER-MISMATCH'),resolveProviderStatus:async()=>({order_id:'OTHER'}),notifyFailure:x=>incidents.push(x)});
 assert.equal(result.status,400);
 result=await memberNotification({store,serverKey:key,notification:signed('MEMBER-IGNORED'),resolveProviderStatus:async()=>({order_id:'MEMBER-IGNORED',transaction_status:'settlement',payment_type:'bank_transfer',status_code:'200'}),notifyFailure:x=>incidents.push(x)});
 assert.deepEqual(result.body,{status:'ignored'});
 await memberNotification({store,serverKey:key,notification:signed('MEMBER-PENDING'),resolveProviderStatus:async()=>({order_id:'MEMBER-PENDING',transaction_status:'pending'}),notifyFailure:x=>incidents.push(x)});
 assert.deepEqual(incidents.map(x=>x.kind),['payment_verification_mismatch','payment_settlement_ignored']);
});
