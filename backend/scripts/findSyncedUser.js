import "dotenv/config";
import { prisma } from "../src/models/prismaClient.js";

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

async function main() {
  const clerkId = getArg("clerk-id");
  const email = getArg("email").toLowerCase();

  // This helper keeps verification simple:
  // - search by clerkId
  // - or by email
  // - or show the most recent synced users if no filter is provided
  let users;

  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { profile: true },
    });
    users = user ? [user] : [];
  } else if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    users = user ? [user] : [];
  } else {
    users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  }

  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((error) => {
    console.error("Failed to query synced user:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
