DROP INDEX "Commission_saleId_key";

CREATE INDEX "Commission_saleId_idx" ON "Commission"("saleId");