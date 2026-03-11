const { PrismaClient } = require('./generated/prisma')
const prisma = new PrismaClient()

async function main() {
  const data = await prisma.test.findMany()
  console.log(data)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())