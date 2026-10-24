export function assignmentInput(body){
 const prompt=body?.prompt,rubric=body?.rubric;
 if(typeof prompt!=='string'||prompt.length>5000||!Array.isArray(rubric)||rubric.length>10)return null;
 if(rubric.some(x=>!x||typeof x.label!=='string'||!x.label.trim()||x.label.length>100||!Number.isInteger(x.max)||x.max<1||x.max>100))return null;
 if(new Set(rubric.map(x=>x.label.trim())).size!==rubric.length)return null;
 return {prompt:prompt.trim(),rubric:rubric.map(x=>({label:x.label.trim(),max:x.max}))};
}
