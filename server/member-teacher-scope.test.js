import assert from 'node:assert/strict';
import {teacherScope} from './member-teacher-scope.js';
let queries=0,allowed=false;
const guard=teacherScope({query:async()=>{queries++;return {rowCount:allowed?1:0}}});
async function check(path,method,expected,body={}){let outcome;await guard({path,method,body,admin:{role:'teacher',email:'teacher@example.test'}},{status(n){outcome=n;return this},json(){}},e=>{if(e)throw e;outcome=200});assert.equal(outcome,expected,path)}
for(const path of ['/members','/orders','/summary','/members/1/access','/orders/1/reconcile'])await check(path,'GET',403);
assert.equal(queries,0);
await check('/courses','POST',403);
await check('/lessons/12','PUT',403);
allowed=true;await check('/lessons/12','PUT',200);await check('/worksheets','POST',200,{lessonId:12});
await check('/worksheets','POST',403,{lessonId:'1 OR true'});
console.log('PASS teacher deny-default and assigned resource guards; integration still required');
