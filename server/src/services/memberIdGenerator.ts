import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../utils/prisma";

const COUNTER_ID = 1;
const PREFIX = "SVI";
const PAD_LENGTH = 6;

type TxClient = Prisma.TransactionClient | PrismaClient;

/**
 * Atomically increments the shared MemberCodeCounter and returns the next
 * member code, e.g. "SVI000007". Must be called with a transaction client
 * (or defaults to the shared client, which still performs the increment
 * atomically at the database level via an atomic `increment` update).
 *
 * Safe to call inside an outer prisma.$transaction(...) so member creation
 * and code generation commit/rollback together.
 */
export async function generateNextMemberCode(client: TxClient = prisma): Promise<string> {
  // Ensure the counter row exists (idempotent upsert), then atomically bump it.
  await client.memberCodeCounter.upsert({
    where: { id: COUNTER_ID },
    create: { id: COUNTER_ID, current: 0 },
    update: {},
  });

  const updated = await client.memberCodeCounter.update({
    where: { id: COUNTER_ID },
    data: { current: { increment: 1 } },
  });

  const padded = String(updated.current).padStart(PAD_LENGTH, "0");
  return `${PREFIX}${padded}`;
}
