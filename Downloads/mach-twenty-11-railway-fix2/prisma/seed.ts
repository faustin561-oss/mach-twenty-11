// Seed script — demo/dev data only. Run with `npm run db:seed`.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const shipper = await prisma.user.upsert({
    where: { email: "shipper@demo.mach2011.com" },
    update: {},
    create: {
      email: "shipper@demo.mach2011.com",
      name: "Meridian Foods Co.",
      role: "CUSTOMER", // see src/lib/enums.ts: UserRole
      passwordHash,
    },
  });

  const carrierUser = await prisma.user.upsert({
    where: { email: "carrier@demo.mach2011.com" },
    update: {},
    create: {
      email: "carrier@demo.mach2011.com",
      name: "Ironline Freight",
      role: "CARRIER", // see src/lib/enums.ts: UserRole
      passwordHash,
      carrierProfile: {
        create: {
          legalName: "Ironline Freight LLC",
          dotNumber: "1234567",
          mcNumber: "MC-987654",
          insuranceOnFile: true,
          // Environment-aware, matching src/lib/json-array.ts: native
          // String[] on the production (Postgres) schema, JSON-encoded
          // string on the SQLite dev schema. Inlined rather than
          // imported since seed.ts runs via tsx outside src/'s "@/*"
          // path-alias resolution.
          equipmentTypes: process.env.NODE_ENV === "production"
            ? (["Dry Van", "Reefer", "Flatbed"] as any)
            : JSON.stringify(["Dry Van", "Reefer", "Flatbed"]),
          operatingAreas: process.env.NODE_ENV === "production"
            ? (["US-Southeast", "US-Midwest"] as any)
            : JSON.stringify(["US-Southeast", "US-Midwest"]),
          membershipActive: true,
          membershipTier: "pro",
        },
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@mach2011.com" },
    update: {},
    create: {
      email: "admin@mach2011.com",
      name: "Platform Admin",
      role: "SUPER_ADMIN", // see src/lib/enums.ts: UserRole
      passwordHash,
    },
  });

  const existingSample = await prisma.shipment.findFirst({ where: { shipperId: shipper.id } });
  if (!existingSample) {
    await prisma.shipment.create({
      data: {
        shipperId: shipper.id,
        mode: "FTL", // see src/lib/enums.ts: ShipmentMode
        status: "OPEN_FOR_BIDS", // see src/lib/enums.ts: ShipmentStatus
        originAddress: "Tampa, FL",
        destAddress: "Charlotte, NC",
        cargoDescription: "Refrigerated Produce",
        weightLb: 38000,
        pickupWindowStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        bidDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Seeded:", { shipper: shipper.email, carrier: carrierUser.email, admin: admin.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
