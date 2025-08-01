import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample data from the MariaDB export - you'll need to adapt this with your actual data
const userData = [
  {
    id: 1,
    username: 'test',
    fullname: 'testowy',
    password: '$2a$10$7.Fal8NbHVikfkSRWiLwmefHCWxQY1oDHPP1KO8oA.qXviMmGuSBu',
    birthdate: '2022-12-04',
    confirmed: true,
    email: 'tttt',
    register_token: '',
    register_date: '2023-01-08',
    last_login: '2023-01-08',
    account_type: 1
  },
  {
    id: 6,
    username: 'test7',
    fullname: 'Testerek2',
    password: '$2a$10$nEPDhi6/VlcsjKbF1oIl8.0o7wC6ygcH.coHs6ido4t/4fjvglyCi',
    birthdate: '2000-01-10',
    confirmed: true,
    email: 'tester@gmail.com',
    register_token: '',
    register_date: '2023-01-08',
    last_login: '2024-01-08',
    account_type: 3
  },
  {
    id: 59,
    username: 'vanity',
    fullname: 'testowa nazwa',
    password: '$2a$10$H.vh/Uhqk9a5ceJWKs6iDepilK7YNRwvfHud3NCX5txabTanR9eke',
    birthdate: '2000-04-21',
    confirmed: true,
    email: 'pawelsatora@gmail.com',
    register_token: '216962',
    register_date: '2023-01-17',
    last_login: '2023-01-17',
    account_type: 1
  }
];

const videoData = [
  {
    id: 2,
    title: 'Black Adam',
    type: 'film',
    seasons: 0,
    genre: 'Adventure',
    production_year: 2022,
    production_country: 'USA',
    director: 'Jaume Collet-Serra',
    tags: 'black adam rock',
    descr: 'amerykański fantastycznonaukowy film akcji na podstawie serii komiksów o superbohaterze o tym samym pseudonimie wydawnictwa DC Comics.',
    thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEuUhkaNo3ALGR5MQ2rvMAemvm5JupIU-YPpe5B-7dnzjFHfbf',
    grade: 6.3,
    reviews_count: 6,
    views: 1987,
    link: 'asdasdasdsadass',
    blocked_reviews: false
  },
  {
    id: 4,
    title: 'The Menu',
    type: 'film',
    seasons: 0,
    genre: 'Horror',
    production_year: 2022,
    production_country: 'USA',
    director: 'Mark Mylod',
    tags: 'cooking menu',
    descr: 'The Menu to amerykański horror z czarną komedią z 2022 roku, wyreżyserowany przez Marka Myloda.',
    thumbnail: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQOSUS4Ru4rwHnM-XGOmspYvDfId-hVTl_85vB5O_pMYcZA0M2O',
    grade: 6.3,
    reviews_count: 6,
    views: 31523,
    link: 'https://www.youtube.com/embed/OAwupP7tZ1s',
    blocked_reviews: false
  },
  {
    id: 9,
    title: 'Wednesday',
    type: 'series',
    seasons: 1,
    genre: 'Comedy',
    production_year: 2022,
    production_country: 'USA',
    director: 'Alfred Gough, Miles Millar',
    tags: 'fantasy dark humour dark comedy',
    descr: 'Gruesomely smart and sarcastic, Wednesday Addams investigates a series of homicides.',
    thumbnail: 'https://pbs.twimg.com/media/FdW7JDpWAAQ1K2Q?format=jpg&name=large',
    grade: 6.3,
    reviews_count: 6,
    views: 21712,
    link: 'https://www.youtube.com/embed/o17HaBfc5tY',
    blocked_reviews: true
  },
  {
    id: 11,
    title: 'Family Guy',
    type: 'series',
    seasons: 2,
    genre: 'Comedy',
    production_year: 1999,
    production_country: 'USA',
    director: 'Seth MacFarlane, David Zuckerman',
    tags: 'sex & nudity violence & gore profanity alcohol drugs & smoking',
    descr: 'Peter Griffin and his family find themselves in hilarious scenarios.',
    thumbnail: 'https://m.media-amazon.com/images/M/MV5BODEwZjEzMjAtNjQxMy00Yjc4LWFlMDAtYjhjZTAxNDU3OTg3XkEyXkFqcGdeQXVyOTM2NTM4MjA@._V1_.jpg',
    grade: 6.3,
    reviews_count: 6,
    views: 31325,
    link: 'https://www.youtube.com/embed/Le1x2To-e6g',
    blocked_reviews: true
  },
  {
    id: 15,
    title: 'Arctic',
    type: 'film',
    seasons: 0,
    genre: 'Adventure',
    production_year: 2018,
    production_country: 'Iceland, USA',
    director: 'Joe Penna',
    tags: 'action adventure drama arctic snow iceland',
    descr: 'A lone pilot survives a plane crash in the Arctic desert.',
    thumbnail: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ9J7ChqG3Up3rszCbmAwJm56xlLdDEPBNolkqkKbSdJQtMtkWU',
    grade: 6.3,
    reviews_count: 6,
    views: 15470,
    link: 'https://www.youtube.com/embed/N5aD9ppoQIo',
    blocked_reviews: false
  }
];

const episodeData = [
  {
    show_id: 11,
    season: 1,
    episode: 1,
    episode_name: 'Test Episode',
    description: 'Test Description'
  },
  {
    show_id: 11,
    season: 1,
    episode: 2,
    episode_name: 'Test Episode 2',
    description: 'Test Episode 2'
  },
  {
    show_id: 9,
    season: 1,
    episode: 1,
    episode_name: 'Wednesday Ep 1',
    description: 'Wednesday ep 1'
  },
  {
    show_id: 9,
    season: 1,
    episode: 2,
    episode_name: 'Wednesday Ep 2',
    description: 'Wednesday Ep 2'
  }
];

const reviewData = [
  {
    user_id: 6,
    video_id: 4,
    comment: 'The Menu is probably one the most strangest and yet extremely absurd thrillers that I\'ve ever seen.',
    grade: 8.0,
    comment_date: '2023-01-08'
  },
  {
    user_id: 6,
    video_id: 9,
    comment: 'I was worried it wouldn\'t be able to compete with other versions of the addams family but WOW!',
    grade: null,
    comment_date: '2023-01-08'
  },
  {
    user_id: 6,
    video_id: 15,
    comment: 'fajnie zimno',
    grade: 8.5,
    comment_date: '2023-01-08'
  }
];

const userLikesData = [
  { user_id: 6, video_id: 4 },
  { user_id: 6, video_id: 9 },
  { user_id: 6, video_id: 11 },
  { user_id: 6, video_id: 15 }
];

async function migrateData() {
  try {
    console.log('Starting data migration...');

    // Create ID mapping for foreign key relationships
    const userIdMap = new Map();
    const videoIdMap = new Map();

    // Migrate Users
    console.log('Migrating users...');
    for (const user of userData) {
      const newUser = await prisma.user.create({
        data: {
          username: user.username,
          fullname: user.fullname,
          password_hash: user.password,
          email: user.email,
          birthdate: new Date(user.birthdate),
          confirmed: user.confirmed,
          register_token: user.register_token,
          register_date: new Date(user.register_date),
          last_login: user.last_login ? new Date(user.last_login) : null,
          account_type: user.account_type
        }
      });
      userIdMap.set(user.id, newUser.id);
      console.log(`Created user: ${user.username}`);
    }

    // Migrate Videos
    console.log('Migrating videos...');
    for (const video of videoData) {
      const newVideo = await prisma.video.create({
        data: {
          title: video.title,
          type: video.type,
          genre: video.genre,
          production_year: video.production_year,
          production_country: video.production_country,
          director: video.director,
          tags: video.tags,
          descr: video.descr,
          thumbnail: video.thumbnail,
          grade: video.grade,
          reviews_count: video.reviews_count,
          views: video.views,
          link: video.link,
          blocked_reviews: video.blocked_reviews
        }
      });
      videoIdMap.set(video.id, newVideo.id);
      console.log(`Created video: ${video.title}`);
    }

    // Migrate Episodes
    console.log('Migrating episodes...');
    for (const episode of episodeData) {
      const videoUuid = videoIdMap.get(episode.show_id);
      if (videoUuid) {
        await prisma.seriesEpisode.create({
          data: {
            show_id: videoUuid,
            season: episode.season,
            episode: episode.episode,
            episode_name: episode.episode_name,
            description: episode.description
          }
        });
        console.log(`Created episode: ${episode.episode_name}`);
      }
    }

    // Migrate Reviews
    console.log('Migrating reviews...');
    for (const review of reviewData) {
      const userUuid = userIdMap.get(review.user_id);
      const videoUuid = videoIdMap.get(review.video_id);
      if (userUuid && videoUuid) {
        await prisma.review.create({
          data: {
            user_id: userUuid,
            video_id: videoUuid,
            comment: review.comment,
            grade: review.grade,
            comment_date: new Date(review.comment_date)
          }
        });
        console.log(`Created review for video ${review.video_id}`);
      }
    }

    // Migrate User Likes
    console.log('Migrating user likes...');
    for (const like of userLikesData) {
      const userUuid = userIdMap.get(like.user_id);
      const videoUuid = videoIdMap.get(like.video_id);
      if (userUuid && videoUuid) {
        await prisma.userLike.create({
          data: {
            user_id: userUuid,
            video_id: videoUuid
          }
        });
        console.log(`Created like for user ${like.user_id} and video ${like.video_id}`);
      }
    }

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData();
}

export { migrateData };
