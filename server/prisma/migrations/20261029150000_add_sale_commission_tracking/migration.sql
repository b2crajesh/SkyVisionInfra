CREATE TYPE "CommissionType" AS ENUM ('JOINING', 'SALE');

ALTER TABLE "Commission"
  RENAME COLUMN "bookingAmount" TO "baseAmount";

ALTER TABLE "Commission"
  ADD COLUMN "type" "CommissionType" NOT NULL DEFAULT 'JOINING',
  ADD COLUMN "saleId" TEXT;

CREATE UNIQUE INDEX "Commission_saleId_key" ON "Commission"("saleId");

ALTER TABLE "Commission"
  ADD CONSTRAINT "Commission_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Commission"
  ALTER COLUMN "type" DROP DEFAULT;
