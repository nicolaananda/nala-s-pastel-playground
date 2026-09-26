# Member Phase 7 API contract

All member routes require `nala_member_session`, return `Cache-Control: private, no-store`, and require an allowed `Origin` on mutations. Member status comes from the server session; active-only operations require verified, non-suspended accounts and `membershipExpiresAt > now`.

## Member `/api/member`

- `GET /catalog` → `{active,courses[]}`. Only published/released courses and lessons appear. Nested course → chapters → lessons includes `isPreview`, progress, worksheet `{id,title}` metadata. `youtubeVideoId` appears only for active members or preview lessons. Preview means video preview only; worksheets and mutations remain active-member gated.
- `PUT /progress/:lessonId` body `{position:int,duration:int,completed:boolean}`. Active only; published/released lesson only.
- `GET /dashboard` → `{continueLearning,recentActivity}`. Published/released content only.
- `PUT /favourites/:courseId` body `{favourite:boolean}`. Published/released course only.
- `GET /worksheets/:id` → private PDF download. Active and released only.
- `POST /orders` body `{planId?:integer}` → `{orderId,amount,redirectUrl}`. Missing `planId` preserves the 30-day/30000 legacy default. Supplied prices are ignored; amount, duration, plan ID/name are snapshotted server-side.

## Member program `/api/member/program`

- `GET /plans` → `{plans:[{id,name,durationDays,price}]}`.
- `POST /vouchers/redeem` body `{code}` → `{membershipExpiresAt}`. Verified/non-suspended account; one redemption per member; global use cap and expiry enforced atomically.
- `GET /questions` → own questions only. `POST /questions` body `{courseId,question}`; active, released course, feature enabled; quota 2/course/30 days atomically.
- `GET /challenges` → feature state plus published challenges.
- `GET /artworks` → own records only. `POST /artworks` body `{courseId?|challengeId?,title?,base64}`; active and enabled; JPG/PNG/WebP, 8 MiB encoded input, 25 MP, decoded and re-encoded WebP without EXIF; quota 2/30 days. Challenge submissions require current open interval and are unique/member/challenge.
- `GET /artworks/:id/image`, `DELETE /artworks/:id` → owner only.
- `POST /artworks/:id/gallery` body `{consent:true,caption}` → pending consent. `DELETE /artworks/:id/gallery` revokes immediately.
- `GET /certificates` → released eligible courses and immutable issued snapshots. `POST /certificates/:courseId` body `{displayName}`; feature/rule enabled, active member, at least one released lesson, every published/released lesson completed; issue is unique and idempotent by member/course.

## Public `/api/member-public`

No membership cookie required. Responses use `Cache-Control: no-store`.

- `GET /gallery` → `{items:[{id,title}]}`. Approved consent only; no member/caption/private fields.
- `GET /gallery/:id/image` → approved image only. Revoked/rejected/pending IDs return 404.

## Owner admin `/api/admin/member-program`

Requires the existing owner admin cookie guard and mutation origin boundary. No production bypass exists.

- `GET /config`; `PUT /flags/:key` `{enabled}`.
- `POST /plans`; `PUT /plans/:id`; `DELETE /plans/:id` archives.
- `POST /vouchers` `{label,reason,days,maxUses,expiresAt}` returns plaintext `code` once; config never returns it. `DELETE /vouchers/:id` archives.
- `PUT /release/:kind/:id`, kind `course|lesson`, body `{releaseAt: ISO|null}`.
- `GET /questions`; `PUT /questions/:id` `{status:'answered'|'closed',answer:string|null}`.
- `GET /artworks`; `GET /artworks/:id/image`; `PUT /artworks/:id/feedback`; `DELETE /artworks/:id`.
- `PUT /gallery/:artworkId` `{status:'approved'|'rejected'}` for pending consent.
- `GET /challenges`; `POST /challenges`; `PUT /challenges/:id`; `DELETE /challenges/:id` archives. Fields: `{title,prompt,opensAt,closesAt,status}`; database and API require `closesAt > opensAt` atomically.
- `PUT /certificates/:courseId` `{enabled}`. `GET /certificates` lists issued certificates with public UUID and minimal owner account fields. `DELETE /certificates/:certificateId` revokes by UUID.

Errors are JSON `{message}`. IDs are positive decimal strings. Integer money/duration/quota fields reject decimals and out-of-range values.