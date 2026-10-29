ALTER TABLE "Commission"
  ADD COLUMN "tdsPercentage" DECIMAL(5, 2),
  ADD COLUMN "tdsAmount" DECIMAL(14, 2),
  ADD COLUMN "netAmount" DECIMAL(14, 2);

UPDATE "Commission"
SET
  "tdsPercentage" = 5.00,
  "tdsAmount" = ROUND("amount" * 0.05, 2),
  "netAmount" = "amount" - ROUND("amount" * 0.05, 2);

ALTER TABLE "Commission"
  ALTER COLUMN "tdsPercentage" SET NOT NULL,
  ALTER COLUMN "tdsAmount" SET NOT NULL,
  ALTER COLUMN "netAmount" SET NOT NULL;