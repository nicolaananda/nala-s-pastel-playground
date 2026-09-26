# Member renewal reminders

Delivery is **at least once**, not exactly once. Workers atomically claim rows with `FOR UPDATE SKIP LOCKED`; a stale `sending` lease becomes claimable after `leaseMinutes`, so work survives a process crash. A crash after SMTP accepts a message but before `sent` is committed can produce a duplicate. Provider failures return the row to `pending` with bounded backoff. The unique `(member_id, reminder_key, entitlement_expires_at)` key prevents duplicate scheduling for one entitlement expiry.

Run manually after migrations 002–005:

```sh
node scripts/member-reminders.mjs --dry-run
node scripts/member-reminders.mjs
```

The command requires explicit `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM`. It does not create schema. `SMTP_PASS` is canonical; `SMTP_PASSWORD` is accepted as an alias. Schedule the non-dry command externally, for example every hour. Do not overlap invocations unnecessarily; row leases make overlap safe but SMTP delivery remains at least once.
