import { PrismaClient } from "@prisma/client";
import config from "../src/config";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash(
    "123456",
    Number(config.jwt.gen_salt),
  );

  // ADMIN
  await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      email: "admin@gmail.com",
      fullName: "Admin User",
      password: hashedPassword,
      role: "Admin",
    },
  });

  // USER
  await prisma.user.upsert({
    where: { email: "ruhulamin.et15@gmail.com" },
    update: {},
    create: {
      email: "ruhulamin.et15@gmail.com",
      fullName: "Ruhul Amin",
      password: hashedPassword,
      role: "User",
    },
  });

  console.log("✅ Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
