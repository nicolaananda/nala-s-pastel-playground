// Teacher requests are deny-by-default; financial/member endpoints never pass.
export const teacherScope=pool=>async(req,res,next)=>{
 if(req.admin?.role!=='teacher')return next();
 try{
  const match=/^\/(courses|chapters|lessons|worksheets)(?:\/([1-9]\d{0,18}))?(?:\/assignment)?\/?$/.exec(req.path);
  if(!match)return res.status(403).json({message:'Akses pengajar tidak diizinkan'});
  const [,kind,id]=match;
  if(kind==='courses'&&!id&&req.method==='GET')return next();
  if(kind==='courses'&&!id)return res.status(403).json({message:'Kursus baru harus ditugaskan oleh admin'});
  let sql,values;
  if(kind==='courses'){sql='SELECT id AS course_id FROM member_courses WHERE id=$1';values=[id]}
  else if(kind==='chapters'&&!id&&req.method==='POST'){sql='SELECT id AS course_id FROM member_courses WHERE id=$1';values=[req.body?.courseId]}
  else if(kind==='lessons'&&!id&&req.method==='POST'){sql='SELECT course_id FROM member_chapters WHERE id=$1';values=[req.body?.chapterId]}
  else if(kind==='worksheets'&&!id&&req.method==='POST'){sql='SELECT ch.course_id FROM member_lessons l JOIN member_chapters ch ON ch.id=l.chapter_id WHERE l.id=$1';values=[req.body?.lessonId]}
  else if(id){sql={chapters:'SELECT course_id FROM member_chapters WHERE id=$1',lessons:'SELECT ch.course_id FROM member_lessons l JOIN member_chapters ch ON ch.id=l.chapter_id WHERE l.id=$1',worksheets:'SELECT ch.course_id FROM member_worksheets w JOIN member_lessons l ON l.id=w.lesson_id JOIN member_chapters ch ON ch.id=l.chapter_id WHERE w.id=$1'}[kind];values=[id]}
  if(!sql||!values?.every(v=>/^[1-9]\d{0,18}$/.test(String(v))))return res.status(403).json({message:'Kelas tidak ditugaskan'});
  const result=await pool.query(`SELECT 1 FROM (${sql}) target JOIN member_teacher_courses tc ON tc.course_id=target.course_id WHERE tc.email=$2`,[...values,req.admin.email]);
  if(!result.rowCount)return res.status(403).json({message:'Kelas tidak ditugaskan'});
  next();
 }catch(error){next(error)}
};
