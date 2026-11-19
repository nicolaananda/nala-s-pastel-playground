BEGIN;
ALTER TABLE member_reward_redemptions DROP CONSTRAINT IF EXISTS member_reward_redemptions_status_check;
ALTER TABLE member_reward_redemptions ADD CONSTRAINT member_reward_redemptions_status_check CHECK(status IN ('requested','preparing','ready','fulfilled','cancelled'));
COMMIT;
