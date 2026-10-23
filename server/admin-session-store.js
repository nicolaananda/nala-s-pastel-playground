import crypto from 'node:crypto';
const hash=token=>crypto.createHash('sha256').update(token).digest('hex');
export const createAdminSessionStore=pool=>({
 issue:async(token,email,expiresAt)=>{await pool.query('INSERT INTO admin_sessions(token_hash,email,expires_at) VALUES($1,$2,$3)',[hash(token),email,new Date(expiresAt)])},
 valid:async(token,email)=>{if(typeof token!=='string'||!token)return false;const row=(await pool.query('SELECT email FROM admin_sessions WHERE token_hash=$1 AND expires_at>now()',[hash(token)])).rows[0];return row?.email===email},
 revokeAll:async email=>{await pool.query('DELETE FROM admin_sessions WHERE email=$1',[email])},
 revoke:async token=>{if(typeof token==='string'&&token)await pool.query('DELETE FROM admin_sessions WHERE token_hash=$1',[hash(token)])}
});
