import express from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const safe = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const id = value => /^[1-9]\d{0,18}$/.test(String(value)) ? String(value) : null;
const clean = (value, max, min = 1) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max ? value.trim() : null;
const entitlementSql = (member = '$1', course = '$2') => `(EXISTS(SELECT 1 FROM member_accounts a WHERE a.id=${member} AND a.email_verified_at IS NOT NULL AND a.suspended_at IS NULL AND a.membership_expires_at>now()) OR EXISTS(SELECT 1 FROM member_course_grants g WHERE g.member_id=${member} AND g.course_id=${course} AND g.revoked_at IS NULL AND g.expires_at>now()))`;
const filePath = (dir, name) => {
  if (!/^[0-9a-f-]{36}\.webp$/.test(name)) throw Object.assign(Error('invalid artwork path'), { status: 404 });
  const file = path.resolve(dir, name);
  if (path.dirname(file) !== path.resolve(dir)) throw Object.assign(Error('invalid artwork path'), { status: 404 });
  return file;
};
const flag = async (pool, key) => Boolean((await pool.query('SELECT enabled FROM member_feature_flags WHERE key=$1', [key])).rows[0]?.enabled);
const enabled = key => safe(async (req, res, next) => (await flag(req.phase7Pool, key)) ? next() : res.status(403).json({ message: 'Fitur tidak aktif' }));


export const voucherHash = code => crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');

export const redeemVoucher = async (pool, memberId, code) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const member = (await client.query('SELECT email_verified_at,suspended_at,membership_expires_at FROM member_accounts WHERE id=$1 FOR UPDATE', [memberId])).rows[0];
    if (!member || !member.email_verified_at || member.suspended_at) throw Object.assign(Error('Akun tidak memenuhi syarat'), { status: 403 });
    const voucher = (await client.query('SELECT * FROM member_vouchers WHERE code_hash=$1 FOR UPDATE', [voucherHash(code)])).rows[0];
    if (!voucher || voucher.archived_at || !voucher.expires_at || new Date(voucher.expires_at) <= new Date() || voucher.uses >= voucher.max_uses) throw Object.assign(Error('Voucher tidak valid, kedaluwarsa, atau habis'), { status: 400 });
    if ((await client.query('SELECT 1 FROM member_voucher_redemptions WHERE voucher_id=$1 AND member_id=$2', [voucher.id, memberId])).rowCount || (await client.query("SELECT 1 FROM member_orders WHERE voucher_id=$1 AND member_id=$2 AND status IN ('pending','paid')", [voucher.id, memberId])).rowCount) throw Object.assign(Error('Voucher sudah digunakan akun ini'), { status: 409 });
    const plan = voucher.plan_id ? (await client.query('SELECT id,name,price,duration_days,access_mode FROM member_plans WHERE id=$1 FOR SHARE', [voucher.plan_id])).rows[0] : null;
    if (voucher.discount_percent < 100) {
      if (!plan) throw Object.assign(Error('Voucher tidak valid, kedaluwarsa, atau habis'), { status: 400 });
      const discountAmount = Math.floor(Number(plan.price) * Number(voucher.discount_percent) / 100);
      await client.query('COMMIT');
      return { result: 'checkout', planId: plan.id, planName: plan.name, discountPercent: voucher.discount_percent, subtotalAmount: plan.price, discountAmount, amount: Number(plan.price) - discountAmount };
    }
    if (voucher.plan_id && !plan) throw Object.assign(Error('Voucher tidak valid, kedaluwarsa, atau habis'), { status: 400 });
    const redemption = (await client.query('INSERT INTO member_voucher_redemptions(voucher_id,member_id) VALUES($1,$2) RETURNING id', [voucher.id, memberId])).rows[0];
    let membershipExpiresAt = member.membership_expires_at, courses = [];
    if (!plan || plan.access_mode === 'legacy_all') {
      membershipExpiresAt = (await client.query("UPDATE member_accounts SET membership_expires_at=GREATEST(COALESCE(membership_expires_at,now()),now())+($2::text||' days')::interval,updated_at=now() WHERE id=$1 RETURNING membership_expires_at", [memberId, voucher.days])).rows[0].membership_expires_at;
    } else {
      courses = (await client.query(`WITH selected AS (SELECT c.id,c.title FROM member_plan_courses pc JOIN member_courses c ON c.id=pc.course_id WHERE pc.plan_id=$2), starts AS (SELECT s.id,s.title,GREATEST(now(),COALESCE((SELECT max(g.expires_at) FROM member_course_grants g WHERE g.member_id=$1 AND g.course_id=s.id AND g.revoked_at IS NULL),now())) starts_at FROM selected s), inserted AS (INSERT INTO member_course_grants(member_id,course_id,source_voucher_redemption_id,starts_at,expires_at) SELECT $1,id,$3,starts_at,starts_at+($4::text||' days')::interval FROM starts RETURNING course_id,expires_at) SELECT i.course_id AS "courseId",s.title,i.expires_at AS "expiresAt" FROM inserted i JOIN selected s ON s.id=i.course_id ORDER BY s.id`, [memberId, plan.id, redemption.id, voucher.days])).rows;
      if (!courses.length) throw Object.assign(Error('Voucher tidak memiliki kelas'), { status: 400 });
    }
    await client.query('UPDATE member_vouchers SET uses=uses+1 WHERE id=$1', [voucher.id]);
    await client.query("INSERT INTO member_access_ledger(member_id,source_type,source_id,days_delta,previous_expires_at,resulting_expires_at,reason,actor) VALUES($1,'admin_grant',$2,$3,$4,$5,'voucher','voucher')", [memberId, `voucher:${voucher.id}:${memberId}`, voucher.days, member.membership_expires_at, membershipExpiresAt]);
    await client.query('COMMIT');
    return { result: 'granted', membershipExpiresAt, planName: plan?.name || voucher.label, courses };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const createPhase7MemberRouter = ({ pool, auth, artworkDir }) => {
  const router = express.Router();
  router.use(auth, (req, _res, next) => { req.phase7Pool = pool; next(); });

  router.get('/plans', safe(async (_req, res) => res.json({ plans: (await pool.query(`SELECT p.id,p.name,p.duration_days AS "durationDays",p.price,p.access_mode AS "accessMode",COALESCE(json_agg(json_build_object('id',c.id,'title',c.title,'status',c.status) ORDER BY c.id) FILTER(WHERE c.id IS NOT NULL),'[]') courses FROM member_plans p LEFT JOIN member_plan_courses pc ON pc.plan_id=p.id LEFT JOIN member_courses c ON c.id=pc.course_id WHERE p.status='active' GROUP BY p.id ORDER BY p.duration_days,p.id`)).rows })));
  router.post('/vouchers/redeem', safe(async (req, res) => {
    const code = clean(req.body?.code, 200);
    if (!code) return res.status(400).json({ message: 'Kode tidak valid' });
    res.json(await redeemVoucher(pool, req.member.id, code));
  }));

  router.get('/questions', safe(async (req, res) => res.json({ enabled: await flag(pool, 'qa'), questions: (await pool.query('SELECT id,course_id AS "courseId",question,answer,status,created_at AS "createdAt",answered_at AS "answeredAt" FROM member_questions WHERE member_id=$1 ORDER BY created_at DESC', [req.member.id])).rows })));
  router.post('/questions', enabled('qa'), safe(async (req, res) => {
    const courseId = id(req.body?.courseId),lessonId=req.body?.lessonId==null?null:id(req.body.lessonId), question = clean(req.body?.question, 1000);
    if (!courseId || !question) return res.status(400).json({ message: 'Pertanyaan tidak valid' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM member_accounts WHERE id=$1 FOR UPDATE', [req.member.id]);
      const course = await client.query(`SELECT 1 FROM member_courses WHERE id=$2 AND status='published' AND (release_at IS NULL OR release_at<=now()) AND ${entitlementSql()}`, [req.member.id, courseId]);
      const quota = await client.query("SELECT count(*)::int n FROM member_questions WHERE member_id=$1 AND course_id=$2 AND created_at>now()-interval '30 days'", [req.member.id, courseId]);
      if (!course.rowCount) throw Object.assign(Error('Kelas tidak tersedia'), { status: 404 });
      if (quota.rows[0].n >= 2) throw Object.assign(Error('Kuota 2 pertanyaan per kelas dalam 30 hari tercapai'), { status: 429 });
      const row = (await client.query('INSERT INTO member_questions(member_id,course_id,question,lesson_id) SELECT $1,$2,$3,$4 WHERE $4::bigint IS NULL OR EXISTS(SELECT 1 FROM member_lessons l JOIN member_chapters ch ON ch.id=l.chapter_id WHERE l.id=$4 AND ch.course_id=$2) RETURNING id,course_id AS "courseId",question,status,created_at AS "createdAt"', [req.member.id, courseId, question,lessonId])).rows[0];
      await client.query('COMMIT');
      res.status(201).json({ question: row });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }));

  router.get('/challenges', safe(async (_req, res) => {
    const on = await flag(pool, 'challenges');
    res.json({ enabled: on, challenges: on ? (await pool.query("SELECT id,title,prompt,opens_at AS \"opensAt\",closes_at AS \"closesAt\" FROM member_challenges WHERE status='published' ORDER BY opens_at DESC,id")).rows : [] });
  }));

  router.get('/notifications',safe(async(req,res)=>{await pool.query(`INSERT INTO member_notification_deliveries(member_id,kind,source_id,title,body,href) SELECT member_id,'evaluation',id::text,'Evaluasi baru',title,'/portal?view=program&artwork='||id FROM member_artworks WHERE member_id=$1 AND evaluated_at IS NOT NULL ON CONFLICT DO NOTHING`,[req.member.id]);await pool.query(`INSERT INTO member_notification_deliveries(member_id,kind,source_id,title,body,href) SELECT $1,'announcement',a.id::text,a.title,a.body,CASE WHEN a.course_id IS NULL THEN '/portal?view=dashboard' ELSE '/portal?view=catalog&course='||a.course_id END FROM member_announcements a WHERE a.published_at<=now() AND (a.expires_at IS NULL OR a.expires_at>now()) AND (a.course_id IS NULL OR EXISTS(SELECT 1 FROM member_course_grants g WHERE g.member_id=$1 AND g.course_id=a.course_id AND g.revoked_at IS NULL AND g.expires_at>now()) OR EXISTS(SELECT 1 FROM member_accounts m WHERE m.id=$1 AND m.membership_expires_at>now())) ON CONFLICT DO NOTHING`,[req.member.id]);res.json({notifications:(await pool.query('SELECT id,kind,title,body,href,read_at AS "readAt",email_status AS "emailStatus",created_at AS "createdAt" FROM member_notification_deliveries WHERE member_id=$1 ORDER BY created_at DESC LIMIT 100',[req.member.id])).rows})}));
  router.put('/notifications/:id/read',safe(async(req,res)=>{const n=id(req.params.id);if(!n)return res.status(400).json({message:'ID tidak valid'});const out=await pool.query('UPDATE member_notification_deliveries SET read_at=now() WHERE id=$1 AND member_id=$2 RETURNING id',[n,req.member.id]);out.rowCount?res.json({success:true}):res.status(404).json({message:'Notifikasi tidak ditemukan'})}));
  router.put('/artworks/:id/read',safe(async(req,res)=>{const n=id(req.params.id);if(!n)return res.status(400).json({message:'ID tidak valid'});const out=await pool.query('UPDATE member_artworks SET feedback_read_at=now() WHERE id=$1 AND member_id=$2 AND evaluated_at IS NOT NULL RETURNING id',[n,req.member.id]);if(out.rowCount)await pool.query("UPDATE member_notification_deliveries SET read_at=now() WHERE member_id=$1 AND kind='evaluation' AND source_id=$2",[req.member.id,n]);return out.rowCount?res.json({success:true}):res.status(404).json({message:'Evaluasi tidak ditemukan'})}));
  router.get('/artworks', safe(async (req, res) => res.json({ enabled: await flag(pool, 'artwork'), galleryEnabled: await flag(pool, 'gallery'), artworks: (await pool.query('SELECT a.id,a.lesson_id AS "lessonId",l.title AS "lessonTitle",c.title AS "courseTitle",a.feedback_read_at AS "feedbackReadAt",a.course_id AS "courseId",a.challenge_id AS "challengeId",a.title,a.feedback,a.score,a.strengths,a.next_practice AS "nextPractice",a.rubric_scores AS "rubricScores",a.evaluated_at AS "evaluatedAt",a.created_at AS "createdAt",g.status AS "galleryStatus" FROM member_artworks a LEFT JOIN member_lessons l ON l.id=a.lesson_id LEFT JOIN member_courses c ON c.id=a.course_id LEFT JOIN member_gallery_consents g ON g.artwork_id=a.id WHERE a.member_id=$1 ORDER BY a.created_at DESC', [req.member.id])).rows })));
  router.post('/artworks', express.json({ limit: '12mb' }), enabled('artwork'), safe(async (req, res) => {
    const revisionOf=id(req.body?.revisionOf);if(req.body?.revisionOf!=null&&!revisionOf)return res.status(400).json({message:'ID revisi tidak valid'});
    const lessonId = id(req.body?.lessonId), courseId = id(req.body?.courseId), challengeId = id(req.body?.challengeId), title = clean(req.body?.title || 'Karya Member Nala', 100);
    if ((req.body?.lessonId!=null&&!lessonId) || (lessonId&&(!courseId||challengeId)) || (!courseId && !challengeId) || !title || typeof req.body?.base64 !== 'string' || req.body.base64.length > 11_200_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(req.body.base64)) return res.status(400).json({ message: 'Karya tidak valid atau melebihi 8MB' });
    const input = Buffer.from(req.body.base64, 'base64');
    if (!input.length || input.length > 8 * 1024 * 1024) return res.status(413).json({ message: 'Karya melebihi 8MB' });
    let output;
    try {
      const image = sharp(input, { limitInputPixels: 25_000_000, failOn: 'error' });
      const metadata = await image.metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format) || !metadata.width || !metadata.height || metadata.width * metadata.height > 25_000_000) throw Error('format');
      output = await image.rotate().webp({ quality: 90 }).toBuffer(); // Re-encode intentionally strips EXIF.
    } catch { return res.status(400).json({ message: 'Gunakan JPG, PNG, atau WebP valid maksimal 25 megapiksel' }); }
    await fs.mkdir(artworkDir, { recursive: true, mode: 0o700 });
    const client = await pool.connect(), storageName = `${crypto.randomUUID()}.webp`, target = filePath(artworkDir, storageName);
    let written = false;
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM member_accounts WHERE id=$1 FOR UPDATE', [req.member.id]);
      if (!revisionOf && Number((await client.query("SELECT count(*) n FROM member_artworks WHERE member_id=$1 AND created_at>now()-interval '30 days'", [req.member.id])).rows[0].n) >= 2) throw Object.assign(Error('Kuota 2 karya dalam 30 hari tercapai'), { status: 429 });
      if (courseId && !(await client.query(`SELECT 1 FROM member_courses WHERE id=$2 AND status='published' AND (release_at IS NULL OR release_at<=now()) AND ${entitlementSql()}`, [req.member.id, courseId])).rowCount) throw Object.assign(Error('Kelas tidak tersedia untuk paket ini'), { status: 403 });
      if (challengeId && !(await client.query("SELECT 1 FROM member_challenges WHERE id=$1 AND status='published' AND opens_at<=now() AND closes_at>now()", [challengeId])).rowCount) throw Object.assign(Error('Tantangan belum dibuka atau sudah ditutup'), { status: 400 });
      if(lessonId&&!(await client.query('SELECT 1 FROM member_lessons l JOIN member_chapters ch ON ch.id=l.chapter_id WHERE l.id=$1 AND ch.course_id=$2 AND (l.release_at IS NULL OR l.release_at<=now())',[lessonId,courseId])).rowCount)throw Object.assign(Error('Materi tidak sesuai kelas'),{status:400});
      let row;
      if(revisionOf){
        const previous=(await client.query('SELECT * FROM member_artworks WHERE id=$1 AND member_id=$2 FOR UPDATE',[revisionOf,req.member.id])).rows[0];
        if(!previous||String(previous.course_id)!==String(courseId)||String(previous.lesson_id)!==String(lessonId)||String(previous.challenge_id)!==String(challengeId))throw Object.assign(Error('Karya revisi tidak ditemukan'),{status:404});
        if(!previous.evaluated_at)throw Object.assign(Error('Tunggu evaluasi sebelum revisi'),{status:409});
        await client.query('INSERT INTO member_artwork_revisions(artwork_id,storage_name,feedback,score,strengths,next_practice,rubric_scores,evaluated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[revisionOf,previous.storage_name,previous.feedback,previous.score,previous.strengths,previous.next_practice,previous.rubric_scores,previous.evaluated_at]);
        row=(await client.query("UPDATE member_artworks SET storage_name=$2,title=$3,feedback=NULL,score=NULL,strengths='',next_practice='',rubric_scores='[]',evaluated_at=NULL,feedback_read_at=NULL,revision_count=revision_count+1 WHERE id=$1 RETURNING id,title",[revisionOf,storageName,title])).rows[0];
        await client.query('DELETE FROM member_gallery_consents WHERE artwork_id=$1',[revisionOf]);
      }else row=(await client.query('INSERT INTO member_artworks(member_id,course_id,challenge_id,title,storage_name,lesson_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,title', [req.member.id, courseId, challengeId, title, storageName,lessonId])).rows[0];
      await fs.writeFile(target, output, { mode: 0o600, flag: 'wx' }); written = true;
      await client.query('COMMIT');
      res.status(201).json({ artwork: row });
    } catch (error) {
      await client.query('ROLLBACK');
      if (written) await fs.rm(target, { force: true });
      throw error;
    } finally { client.release(); }
  }));
  router.get('/artworks/:id/revisions',safe(async(req,res)=>{const n=id(req.params.id);if(!n)return res.status(400).json({message:'ID tidak valid'});if(!(await pool.query('SELECT 1 FROM member_artworks WHERE id=$1 AND member_id=$2',[n,req.member.id])).rowCount)return res.status(404).json({message:'Karya tidak ditemukan'});res.json({revisions:(await pool.query('SELECT id,feedback,score,strengths,next_practice AS "nextPractice",rubric_scores AS "rubricScores",evaluated_at AS "evaluatedAt",created_at AS "createdAt" FROM member_artwork_revisions WHERE artwork_id=$1 ORDER BY id DESC',[n])).rows})}));
  router.get('/artworks/:id/image', safe(async (req, res, next) => {
    const artworkId = id(req.params.id);
    if (!artworkId) return res.status(400).json({ message: 'ID tidak valid' });
    const row = (await pool.query('SELECT storage_name FROM member_artworks WHERE id=$1 AND member_id=$2', [artworkId, req.member.id])).rows[0];
    if (!row) return res.status(404).json({ message: 'Karya tidak ditemukan' });
    res.type('image/webp').sendFile(filePath(artworkDir, row.storage_name), error => error && next(error));
  }));
  router.delete('/artworks/:id', safe(async (req, res) => {
    const artworkId = id(req.params.id);
    if (!artworkId) return res.status(400).json({ message: 'ID tidak valid' });
    const row = (await pool.query('DELETE FROM member_artworks WHERE id=$1 AND member_id=$2 RETURNING storage_name', [artworkId, req.member.id])).rows[0];
    if (!row) return res.status(404).json({ message: 'Karya tidak ditemukan' });
    await fs.rm(filePath(artworkDir, row.storage_name), { force: true });
    res.json({ success: true });
  }));
  router.post('/artworks/:id/gallery', enabled('gallery'), safe(async (req, res) => {
    const artworkId = id(req.params.id), caption = clean(req.body?.caption, 100);
    if (!artworkId || req.body?.consent !== true || !caption || /@|https?:|\d{6,}/i.test(caption)) return res.status(400).json({ message: 'Persetujuan dan caption tanpa kontak/URL diperlukan' });
    const row = (await pool.query("INSERT INTO member_gallery_consents(artwork_id,member_id,caption,status,consented_at) SELECT id,$2,$3,'pending',now() FROM member_artworks WHERE id=$1 AND member_id=$2 ON CONFLICT(artwork_id) DO UPDATE SET caption=$3,status='pending',consented_at=now(),moderated_at=NULL WHERE member_gallery_consents.member_id=$2 RETURNING artwork_id AS \"artworkId\"", [artworkId, req.member.id, caption])).rows[0];
    row ? res.json(row) : res.status(404).json({ message: 'Karya tidak ditemukan' });
  }));
  router.delete('/artworks/:id/gallery', safe(async (req, res) => {
    const artworkId = id(req.params.id);
    if (!artworkId) return res.status(400).json({ message: 'ID tidak valid' });
    await pool.query("UPDATE member_gallery_consents SET status='revoked',moderated_at=now() WHERE artwork_id=$1 AND member_id=$2", [artworkId, req.member.id]);
    res.json({ success: true });
  }));

  router.get('/gallery', enabled('gallery'), safe(async (_req,res)=>res.json({items:(await pool.query("SELECT a.id,a.title,g.caption FROM member_artworks a JOIN member_gallery_consents g ON g.artwork_id=a.id WHERE g.status='approved' ORDER BY g.moderated_at DESC,a.id")).rows})));
  router.post('/gallery/:id/reports', enabled('gallery'), safe(async (req,res)=>{const artworkId=id(req.params.id),reason=clean(req.body?.reason,500,3);if(!artworkId||!reason)return res.status(400).json({message:'Laporan tidak valid'});const out=await pool.query("INSERT INTO member_content_reports(member_id,artwork_id,reason) SELECT $1,a.id,$3 FROM member_artworks a JOIN member_gallery_consents g ON g.artwork_id=a.id WHERE a.id=$2 AND g.status='approved' ON CONFLICT(member_id,artwork_id) DO UPDATE SET reason=$3,status='pending',resolved_by=NULL,resolved_at=NULL RETURNING id",[req.member.id,artworkId,reason]);out.rowCount?res.status(201).json({report:out.rows[0]}):res.status(404).json({message:'Karya galeri tidak ditemukan'})}));
  router.get('/learning-paths',safe(async(req,res)=>{const paths=(await pool.query(`SELECT p.id,p.slug,p.title,p.description,COALESCE(json_agg(json_build_object('id',c.id,'title',c.title,'sortOrder',pc.sort_order,'completed',NOT EXISTS(SELECT 1 FROM member_lessons l JOIN member_chapters ch ON ch.id=l.chapter_id WHERE ch.course_id=c.id AND NOT EXISTS(SELECT 1 FROM member_progress x WHERE x.member_id=$1 AND x.lesson_id=l.id AND x.completed)),'unlocked',NOT EXISTS(SELECT 1 FROM member_course_prerequisites cp WHERE cp.course_id=c.id AND EXISTS(SELECT 1 FROM member_lessons l JOIN member_chapters ch ON ch.id=l.chapter_id WHERE ch.course_id=cp.prerequisite_course_id AND NOT EXISTS(SELECT 1 FROM member_progress x WHERE x.member_id=$1 AND x.lesson_id=l.id AND x.completed)))) ORDER BY pc.sort_order) FILTER(WHERE c.id IS NOT NULL),'[]') courses FROM member_learning_paths p LEFT JOIN member_learning_path_courses pc ON pc.path_id=p.id LEFT JOIN member_courses c ON c.id=pc.course_id WHERE p.status='published' GROUP BY p.id ORDER BY p.sort_order,p.id`,[req.member.id])).rows;res.json({paths})}));
  router.get('/badges',safe(async(req,res)=>{await pool.query(`INSERT INTO member_badge_awards(badge_id,member_id) SELECT b.id,$1 FROM member_badges b WHERE b.enabled AND b.course_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM member_lessons l JOIN member_chapters ch ON ch.id=l.chapter_id WHERE ch.course_id=b.course_id AND NOT EXISTS(SELECT 1 FROM member_progress p WHERE p.member_id=$1 AND p.lesson_id=l.id AND p.completed)) ON CONFLICT DO NOTHING`,[req.member.id]);res.json({badges:(await pool.query('SELECT b.id,b.slug,b.title,b.description,a.awarded_at AS "awardedAt" FROM member_badge_awards a JOIN member_badges b ON b.id=a.badge_id WHERE a.member_id=$1 ORDER BY a.awarded_at DESC',[req.member.id])).rows})}));

  const eligibilitySql = `c.status='published' AND (c.release_at IS NULL OR c.release_at<=now()) AND ${entitlementSql('$1','c.id')} AND cr.enabled AND EXISTS(SELECT 1 FROM member_lessons l JOIN member_chapters ch ON ch.id=l.chapter_id WHERE ch.course_id=c.id AND (l.release_at IS NULL OR l.release_at<=now())) AND NOT EXISTS(SELECT 1 FROM member_lessons l JOIN member_chapters ch ON ch.id=l.chapter_id WHERE ch.course_id=c.id AND (l.release_at IS NULL OR l.release_at<=now()) AND NOT EXISTS(SELECT 1 FROM member_progress p WHERE p.lesson_id=l.id AND p.member_id=$1 AND p.completed))`;
  router.get('/certificates', safe(async (req, res) => {
    const on = await flag(pool, 'certificates');
    const certificates = on ? (await pool.query(`SELECT c.id AS "courseId",c.title,cr.enabled,mc.certificate_id AS "certificateId",mc.course_title AS "courseTitle",mc.display_name AS "displayName",mc.issued_at AS "issuedAt",mc.revoked_at AS "revokedAt",(${eligibilitySql}) eligible FROM member_courses c JOIN member_certificate_rules cr ON cr.course_id=c.id LEFT JOIN member_certificates mc ON mc.course_id=c.id AND mc.member_id=$1 WHERE c.status='published' AND (c.release_at IS NULL OR c.release_at<=now()) AND cr.enabled ORDER BY c.id`, [req.member.id])).rows : [];
    res.json({ enabled: on, certificates });
  }));
  router.post('/certificates/:courseId', enabled('certificates'), safe(async (req, res) => {
    const courseId = id(req.params.courseId), displayName = clean(req.body?.displayName, 100, 2);
    if (!courseId || !displayName) return res.status(400).json({ message: 'Nama cetak tidak valid' });
    const row = (await pool.query(`INSERT INTO member_certificates(certificate_id,member_id,course_id,course_title,display_name) SELECT gen_random_uuid(),$1,c.id,c.title,$3 FROM member_courses c JOIN member_certificate_rules cr ON cr.course_id=c.id WHERE c.id=$2 AND ${eligibilitySql} ON CONFLICT(member_id,course_id) DO UPDATE SET display_name=member_certificates.display_name RETURNING certificate_id AS "certificateId",course_id AS "courseId",course_title AS "courseTitle",display_name AS "displayName",issued_at AS "issuedAt",revoked_at AS "revokedAt"`, [req.member.id, courseId, displayName])).rows[0];
    row ? res.status(201).json({ certificate: row }) : res.status(409).json({ message: 'Kriteria penyelesaian belum terpenuhi' });
  }));
  return router;
};

export const createPhase7PublicRouter = ({ pool, artworkDir }) => {
  const router = express.Router();
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/gallery', safe(async (_req, res) => res.json({ items: await flag(pool, 'gallery') ? (await pool.query("SELECT a.id,a.title FROM member_artworks a JOIN member_gallery_consents g ON g.artwork_id=a.id WHERE g.status='approved' ORDER BY g.moderated_at DESC,a.id")).rows : [] })));
  router.get('/gallery/:id/image', safe(async (req, res, next) => {
    const artworkId = id(req.params.id);
    if (!artworkId || !await flag(pool, 'gallery')) return res.sendStatus(404);
    const row = (await pool.query("SELECT a.storage_name FROM member_artworks a JOIN member_gallery_consents g ON g.artwork_id=a.id WHERE a.id=$1 AND g.status='approved'", [artworkId])).rows[0];
    if (!row) return res.sendStatus(404);
    res.type('image/webp').sendFile(filePath(artworkDir, row.storage_name), error => error && next(error));
  }));
  return router;
};
