-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sourceMemberId" TEXT NOT NULL,
    "bookingAmount" DECIMAL(14,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Commission_memberId_idx" ON "Commission"("memberId");

-- CreateIndex
CREATE INDEX "Commission_sourceMemberId_idx" ON "Commission"("sourceMemberId");

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_sourceMemberId_fkey" FOREIGN KEY ("sourceMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
