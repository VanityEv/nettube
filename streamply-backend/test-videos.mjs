import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  try {
    const videos = await prisma.video.findMany({
      select: { id: true, title: true, type: true }
    });
    console.log('Available videos:');
    videos.forEach(video => {
      console.log(`- ID: ${video.id}, Title: "${video.title}", Type: ${video.type}`);
    });
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
})();
