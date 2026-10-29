ALTER TABLE "Rank"
  ADD COLUMN "commissionPercentage" INTEGER NOT NULL DEFAULT 0;

UPDATE "Rank"
SET
  "sortOrder" = CASE "name"
    WHEN 'Junior Executive' THEN 1
    WHEN 'Executive' THEN 2
    WHEN 'Senior Executive' THEN 3
    WHEN 'Manager' THEN 4
    WHEN 'Senior Manager' THEN 5
    WHEN 'Ambassador' THEN 6
  END,
  "commissionPercentage" = CASE "name"
    WHEN 'Junior Executive' THEN 5
    WHEN 'Executive' THEN 6
    WHEN 'Senior Executive' THEN 7
    WHEN 'Manager' THEN 8
    WHEN 'Senior Manager' THEN 9
    WHEN 'Ambassador' THEN 10
  END
WHERE "name" IN (
  'Junior Executive',
  'Executive',
  'Senior Executive',
  'Manager',
  'Senior Manager',
  'Ambassador'
);

INSERT INTO "Rank" ("id", "name", "sortOrder", "commissionPercentage", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Ambassador', 6, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Rank" WHERE "name" = 'Ambassador'
);

ALTER TABLE "Rank"
  ALTER COLUMN "commissionPercentage" DROP DEFAULT;
