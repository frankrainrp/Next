import { prisma } from './src/server/db.js';

async function main() {
  const users = await prisma.appUser.findMany();
  console.log('USERS:', JSON.stringify(users, null, 2));
  const projects = await prisma.project.findMany({
    include: {
      agentSession: true
    }
  });
  console.log('PROJECTS:', JSON.stringify(projects, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
