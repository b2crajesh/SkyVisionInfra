UPDATE "Rank"
SET "name" = '__rank_rename__' || "id"
WHERE "name" IN ('Associate', 'Silver', 'Gold', 'Platinum', 'Diamond');

UPDATE "Rank"
SET
  "name" = CASE "sortOrder"
    WHEN 1 THEN 'Junior Executive'
    WHEN 2 THEN 'Executive'
    WHEN 3 THEN 'Senior Executive'
    WHEN 4 THEN 'Manager'
    WHEN 5 THEN 'Senior Manager'
  END,
  "sortOrder" = CASE "sortOrder"
    WHEN 1 THEN 1
    WHEN 2 THEN 2
    WHEN 3 THEN 3
    WHEN 4 THEN 4
    WHEN 5 THEN 5
  END
WHERE "name" LIKE '__rank_rename__%';

INSERT INTO "Rank" ("id", "name", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, ranks."name", ranks."sortOrder", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Junior Executive', 1),
  ('Executive', 2),
  ('Senior Executive', 3),
  ('Manager', 4),
  ('Senior Manager', 5)
) AS ranks("name", "sortOrder")
WHERE NOT EXISTS (
  SELECT 1 FROM "Rank" existing WHERE existing."name" = ranks."name"
);
