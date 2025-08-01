import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getOneVideo = async (title) => {
  try {
    console.log(`Searching for video with title: "${title}"`);
    
    // First try exact match
    let video = await prisma.video.findFirst({
      where: { title: title }
    });
    console.log('Exact match result:', video);
    
    // If not found, try case-insensitive search
    if (!video) {
      video = await prisma.video.findFirst({
        where: { 
          title: { 
            equals: title,
            mode: 'insensitive'
          } 
        }
      });
      console.log('Case-insensitive match result:', video);
    }
    
    // If still not found, try converting kebab-case to title case
    if (!video) {
      // Convert "drumming" to "Drumming", "white-noise" to "White Noise", etc.
      const titleCaseTitle = title
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      console.log(`Trying title case: "${titleCaseTitle}"`);
      video = await prisma.video.findFirst({
        where: { title: titleCaseTitle }
      });
      console.log('Title case match result:', video);
    }
    
    return video;
  } catch (error) {
    console.error('Error in getOneVideo:', error);
    return null;
  }
};

(async () => {
  const result = await getOneVideo('drumming');
  console.log('Final result:', result);
  await prisma.$disconnect();
})();
