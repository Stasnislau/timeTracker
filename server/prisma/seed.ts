import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaultProject = await prisma.project.findFirst({
    where: {
      name: "@Default",
    },
  });

  if (!defaultProject) {
    await prisma.project.create({
      data: {
        name: "@Default",
      },
    });
    console.log("Default project has been created");
  } else {
    console.log("Default project already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
