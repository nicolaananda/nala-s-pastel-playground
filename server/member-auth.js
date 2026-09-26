import crypto from 'crypto';

const N=16384,R=8,P=1,SALT_BYTES=16,KEY_BYTES=64;
const b64=value=>Buffer.from(value).toString('base64url');
const derive=(password,salt)=>new Promise((resolve,reject)=>crypto.scrypt(password,salt,KEY_BYTES,{N,r:R,p:P,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));
export const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
export const opaqueToken=()=>crypto.randomBytes(32).toString('base64url');
export const normalizeEmail=value=>String(value||'').trim().toLowerCase();
export const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254;
export const validPassword=value=>typeof value==='string'&&Buffer.byteLength(value,'utf8')>=10&&Buffer.byteLength(value,'utf8')<=200;
export const hashPassword=async password=>{const salt=crypto.randomBytes(SALT_BYTES),key=await derive(password,salt);return `scrypt$${N}$${R}$${P}$${b64(salt)}$${b64(key)}`};
export const verifyPassword=async(password,encoded)=>{try{const parts=String(encoded).split('$');if(parts.length!==6||parts[0]!=='scrypt'||parts[1]!==String(N)||parts[2]!==String(R)||parts[3]!==String(P)||parts[4].length>64||parts[5].length>128)return false;const salt=Buffer.from(parts[4],'base64url'),expected=Buffer.from(parts[5],'base64url');if(salt.length!==SALT_BYTES||expected.length!==KEY_BYTES)return false;const actual=await derive(password,salt);return crypto.timingSafeEqual(actual,expected)}catch{return false}};
export const parseCookies=(header='')=>{const out={};for(const pair of header.split(';')){const [name,...rest]=pair.trim().split('=');if(!name||!rest.length)continue;try{out[name]=decodeURIComponent(rest.join('='))}catch{}}return out};
export const verifySignedJson=(token,secret,maxBodyBytes=2048)=>{try{if(typeof token!=='string'||token.length>4096)return null;const parts=token.split('.');if(parts.length!==2||!parts[0]||!parts[1])return null;const [body,signature]=parts,expected=crypto.createHmac('sha256',secret).update(body).digest('base64url');if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;const decoded=Buffer.from(body,'base64url');if(!decoded.length||decoded.length>maxBodyBytes||decoded.toString('base64url')!==body)return null;const payload=JSON.parse(decoded.toString('utf8'));return payload&&typeof payload==='object'&&!Array.isArray(payload)?payload:null}catch{return null}};
export const makeMemberCookie=(token,production=false)=>`nala_member_session=${encodeURIComponent(token)}; Path=/api/member; HttpOnly; SameSite=Lax; Max-Age=2592000${production?'; Secure':''}`;
export const clearMemberCookie=(production=false)=>`nala_member_session=; Path=/api/member; HttpOnly; SameSite=Lax; Max-Age=0${production?'; Secure':''}`;
