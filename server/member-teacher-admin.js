import express from 'express';
import {normalizeEmail,validEmail,validPassword,hashPassword} from './member-auth.js';
export const createTeacherAdminRouter=({pool,audit=async()=>{}})=>{
 const r=express.Router();
 r.use((req,res,next)=>req.admin?.role==='owner'?next():res.status(403).json({message:'Hanya owner'}));
 r.get('/',async(req,res,next)=>{try{res.json({teachers:(await pool.query('SELECT t.email,t.enabled,COALESCE(array_agg(tc.course_id) FILTER(WHERE tc.course_id IS NOT NULL),ARRAY[]::bigint[]) AS courses FROM member_teachers t LEFT JOIN member_teacher_courses tc ON tc.email=t.email GROUP BY t.email ORDER BY t.email')).rows})}catch(e){next(e)}});
 r.put('/',async(req,res,next)=>{
  const email=normalizeEmail(req.body?.email),password=req.body?.password,enabled=req.body?.enabled,courses=req.body?.courses;
  if(!validEmail(email)||email===req.admin?.email||typeof enabled!=='boolean'||!Array.isArray(courses)||courses.length>200||!courses.every(id=>/^[1-9]\d{0,18}$/.test(String(id)))||(password!==undefined&&password!==''&&!validPassword(password)))return res.status(400).json({message:'Data pengajar tidak valid'});
  let client;
  try{const hash=password?await hashPassword(password):null;client=await pool.connect();await client.query('BEGIN');
   await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[email]);
   const exists=(await client.query('SELECT email FROM member_teachers WHERE email=$1 FOR UPDATE',[email])).rowCount;
   if(!exists&&!hash){await client.query('ROLLBACK');return res.status(400).json({message:'Password wajib untuk pengajar baru'})}
   if(exists)await client.query('UPDATE member_teachers SET enabled=$2,password_hash=COALESCE($3,password_hash),updated_at=now() WHERE email=$1',[email,enabled,hash]);
   else await client.query('INSERT INTO member_teachers(email,password_hash,enabled) VALUES($1,$2,$3)',[email,hash,enabled]);
   await client.query('DELETE FROM member_teacher_courses WHERE email=$1',[email]);
   for(const id of new Set(courses.map(String)))await client.query('INSERT INTO member_teacher_courses(email,course_id) VALUES($1,$2)',[email,id]);
   await client.query('DELETE FROM admin_sessions WHERE email=$1',[email]);
   await client.query('COMMIT');await audit(req,'update_teacher','teacher',email,{enabled,courses});res.json({success:true});
  }catch(e){if(client)await client.query('ROLLBACK');if(e.code==='23503')return res.status(400).json({message:'Kursus tidak ditemukan'});next(e)}finally{client?.release()}
 });return r;
};
