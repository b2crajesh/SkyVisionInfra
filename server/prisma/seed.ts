import { PrismaClient, Relationship } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const RANKS = [
  { name: "Associate", sortOrder: 1 },
  { name: "Silver", sortOrder: 2 },
  { name: "Gold", sortOrder: 3 },
  { name: "Platinum", sortOrder: 4 },
  { name: "Diamond", sortOrder: 5 },
];

const ADMIN_USER_ID = "admin";
const ADMIN_PASSWORD = "Admin@12345";

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding ranks...");
  const rankRecords: Record<string, string> = {};
  for (const r of RANKS) {
    const rank = await prisma.rank.upsert({
      where: { name: r.name },
      create: { name: r.name, sortOrder: r.sortOrder },
      update: { sortOrder: r.sortOrder },
    });
    rankRecords[r.name] = rank.id;
  }

  console.log("Seeding member code counter...");
  await prisma.memberCodeCounter.upsert({
    where: { id: 1 },
    create: { id: 1, current: 0 },
    update: {},
  });

  console.log("Seeding admin user...");
  const adminPasswordHash = await hash(ADMIN_PASSWORD);
  await prisma.user.upsert({
    where: { userId: ADMIN_USER_ID },
    create: {
      userId: ADMIN_USER_ID,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    update: {},
  });

  console.log("Seeding demo members...");

  const demoMembers = [
    {
      code: "SVI000001",
      name: "Rajesh Kumar Sharma",
      address: "12/4, MG Road, Andheri East, Mumbai, Maharashtra 400069",
      dateOfBirth: new Date("1985-04-12"),
      aadhaarNumber: "234567890123",
      panNumber: "ABCPS1234F",
      bookingAmount: "500000.00",
      nomineeName: "Sunita Sharma",
      relationship: Relationship.SPOUSE,
      rank: "Gold",
      sponsorCode: null as string | null,
    },
    {
      code: "SVI000002",
      name: "Priya Venkatesh Iyer",
      address: "45, Anna Nagar 2nd Street, Chennai, Tamil Nadu 600040",
      dateOfBirth: new Date("1990-09-23"),
      aadhaarNumber: "345678901234",
      panNumber: "BXYPI5678K",
      bookingAmount: "250000.00",
      nomineeName: "Venkatesh Iyer",
      relationship: Relationship.FATHER,
      rank: "Silver",
      sponsorCode: "SVI000001",
    },
    {
      code: "SVI000003",
      name: "Amit Baburao Patil",
      address: "Flat 302, Kothrud Heights, Pune, Maharashtra 411038",
      dateOfBirth: new Date("1988-01-30"),
      aadhaarNumber: "456789012345",
      panNumber: "CQWPP9012L",
      bookingAmount: "750000.00",
      nomineeName: "Rekha Patil",
      relationship: Relationship.MOTHER,
      rank: "Platinum",
      sponsorCode: "SVI000001",
    },
  ];

  const createdCreds: Array<{ userId: string; password: string; name: string }> = [];
  const memberIdByCode: Record<string, string> = {};

  for (const dm of demoMembers) {
    const tempPassword = `Svi@${dm.code.slice(-4)}9`;
    const passwordHash = await hash(tempPassword);

    const existingUser = await prisma.user.findUnique({ where: { userId: dm.code } });
    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const user = await prisma.user.create({
        data: { userId: dm.code, passwordHash, role: "MEMBER", status: "ACTIVE" },
      });
      userId = user.id;
    }

    const sponsorMemberId = dm.sponsorCode ? memberIdByCode[dm.sponsorCode] ?? null : null;

    const member = await prisma.member.upsert({
      where: { memberCode: dm.code },
      create: {
        userId,
        memberCode: dm.code,
        name: dm.name,
        address: dm.address,
        dateOfBirth: dm.dateOfBirth,
        aadhaarNumber: dm.aadhaarNumber,
        panNumber: dm.panNumber,
        bookingAmount: dm.bookingAmount,
        nomineeName: dm.nomineeName,
        relationship: dm.relationship,
        rankId: rankRecords[dm.rank],
        sponsorMemberId,
      },
      update: {},
    });

    memberIdByCode[dm.code] = member.id;
    createdCreds.push({ userId: dm.code, password: tempPassword, name: dm.name });
  }

  await prisma.memberCodeCounter.update({ where: { id: 1 }, data: { current: demoMembers.length } });

  console.log("Seeding demo sales...");
  const adminUser = await prisma.user.findUnique({ where: { userId: ADMIN_USER_ID } });
  if (adminUser) {
    const salesData = [
      { code: "SVI000001", plotReference: "PLT-A-101", area: "1200.50", amount: "500000.00", saleDate: new Date("2025-02-10") },
      { code: "SVI000002", plotReference: "PLT-B-207", area: "800.00", amount: "250000.00", saleDate: new Date("2025-04-18") },
      { code: "SVI000003", plotReference: "PLT-C-315", area: "1500.75", amount: "750000.00", saleDate: new Date("2025-06-05") },
    ];
    for (const s of salesData) {
      const memberId = memberIdByCode[s.code];
      if (!memberId) continue;
      const already = await prisma.sale.findFirst({ where: { memberId, plotReference: s.plotReference } });
      if (already) continue;
      await prisma.sale.create({
        data: {
          memberId,
          plotReference: s.plotReference,
          area: s.area,
          amount: s.amount,
          saleDate: s.saleDate,
          createdByUserId: adminUser.id,
        },
      });
    }
  }

  console.log("\n================ SEED COMPLETE ================");
  console.log("ADMIN LOGIN");
  console.log(`  userId:   ${ADMIN_USER_ID}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log("\nDEMO MEMBER LOGINS (temp passwords)");
  for (const c of createdCreds) {
    console.log(`  ${c.name} -> userId: ${c.userId} | password: ${c.password}`);
  }
  console.log("=================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
