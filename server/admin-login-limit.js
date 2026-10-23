// ponytail: process-local limiter; use shared storage before multi-instance deployment.
export const adminLoginLimit=({now=Date.now,maximum=10,windowMs=60000,capacity=10000}={})=>{
 const buckets=new Map();
 return(req,res,next)=>{
  const time=now();for(const [key,value] of buckets)if(value.until<=time)buckets.delete(key);
  const key=req.ip||req.socket?.remoteAddress||'unknown';let entry=buckets.get(key);
  if(!entry){if(buckets.size>=capacity)return res.status(429).json({message:'Terlalu banyak percobaan login'});entry={count:0,until:time+windowMs};buckets.set(key,entry)}
  if(++entry.count>maximum){res.set('Retry-After',String(Math.max(1,Math.ceil((entry.until-time)/1000))));return res.status(429).json({message:'Terlalu banyak percobaan login. Coba lagi nanti.'})}
  next();
 };
};
