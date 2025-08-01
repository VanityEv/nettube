import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Full data from your MariaDB export
const FULL_USER_DATA = [
  {
    id: 1,
    username: 'test',
    fullname: 'testowy',
    password: '$2a$10$7.Fal8NbHVikfkSRWiLwmefHCWxQY1oDHPP1KO8oA.qXviMmGuSBu',
    birthdate: '2022-12-04',
    confirmed: 1,
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
    confirmed: 1,
    email: 'tester@gmail.com',
    register_token: '',
    register_date: '2023-01-08',
    last_login: '2024-01-08',
    account_type: 3
  },
  {
    id: 7,
    username: 'jerzy',
    fullname: 'tester',
    password: '$2a$10$iymHPW8E58TCVJl8.BJh1upetmCuzs24tkPvOnaKa6WH620hakiLK',
    birthdate: '2001-04-05',
    confirmed: 0,
    email: 'tttt6',
    register_token: '',
    register_date: '2023-01-08',
    last_login: '2023-01-08',
    account_type: 1
  },
  {
    id: 59,
    username: 'vanity',
    fullname: 'testowa nazwa',
    password: '$2a$10$H.vh/Uhqk9a5ceJWKs6iDepilK7YNRwvfHud3NCX5txabTanR9eke',
    birthdate: '2000-04-21',
    confirmed: 1,
    email: 'pawelsatora@gmail.com',
    register_token: '216962',
    register_date: '2023-01-17',
    last_login: '2023-01-17',
    account_type: 1
  }
];

const FULL_VIDEO_DATA = [
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
    alt: 'black-adam-error',
    grade: 6.3,
    reviews_count: 6,
    views: 1987,
    link: 'asdasdasdsadass',
    blocked_reviews: 0
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
    alt: 'the-menu',
    grade: 6.3,
    reviews_count: 6,
    views: 31523,
    link: 'https://www.youtube.com/embed/OAwupP7tZ1s',
    blocked_reviews: 0
  },
  {
    id: 6,
    title: 'Doctor Strange in the Multiverse of Madness',
    type: 'film',
    seasons: 0,
    genre: 'Action',
    production_year: 2022,
    production_country: 'USA',
    director: 'Sam Raimi',
    tags: 'strange action scifi multiverse',
    descr: 'Doktor Strange w multiwersum obłędu – amerykański fantastycznonaukowy film akcji.',
    thumbnail: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQqMFOn0f5Wg7z8947nRFTTeT_pImkelLrK1dXG521q_oJxtbo2',
    alt: 'doctor-strange',
    grade: 6.3,
    reviews_count: 6,
    views: 35662,
    link: '',
    blocked_reviews: 0
  },
  {
    id: 7,
    title: 'Lucifer',
    type: 'series',
    seasons: 1,
    genre: 'Crime fiction',
    production_year: 2016,
    production_country: 'USA',
    director: 'Tom Kapinos',
    tags: 'satiric exciting',
    descr: 'The series revolves around Lucifer Morningstar who abandons Hell for Los Angeles.',
    thumbnail: 'https://m.media-amazon.com/images/M/MV5BNDJjMzc4NGYtZmFmNS00YWY3LThjMzQtYzJlNGFkZGRiOWI1XkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg',
    alt: 'lucifer',
    grade: 6.3,
    reviews_count: 6,
    views: 25742,
    link: '',
    blocked_reviews: 0
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
    alt: 'wednesday',
    grade: 6.3,
    reviews_count: 6,
    views: 21712,
    link: 'https://www.youtube.com/embed/o17HaBfc5tY',
    blocked_reviews: 1
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
    alt: 'familyguy',
    grade: 6.3,
    reviews_count: 6,
    views: 31325,
    link: 'https://www.youtube.com/embed/Le1x2To-e6g',
    blocked_reviews: 1
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
    alt: 'arctic',
    grade: 6.3,
    reviews_count: 6,
    views: 15470,
    link: 'https://www.youtube.com/embed/N5aD9ppoQIo',
    blocked_reviews: 0
  }
];

const EPISODE_DATA = [
  {
    id: 1,
    show_id: 11,
    season: 1,
    episode: 3,
    episode_name: 'The Next Voice You Hear....',
    description: 'Praesent blandit.'
  },
  {
    id: 21,
    show_id: 11,
    season: 1,
    episode: 1,
    episode_name: 'Test Episode',
    description: 'Test Description'
  },
  {
    id: 23,
    show_id: 11,
    season: 1,
    episode: 2,
    episode_name: 'Test Episode 2',
    description: 'Test Episode 2'
  },
  {
    id: 24,
    show_id: 9,
    season: 1,
    episode: 1,
    episode_name: 'Wednesday Ep 1',
    description: 'Wednesday ep 1'
  },
  {
    id: 25,
    show_id: 9,
    season: 1,
    episode: 2,
    episode_name: 'Wednesday Ep 2',
    description: 'Wednesday Ep 2'
  }
];

const REVIEW_DATA = [
  {
    id: 12,
    user_id: 6,
    show_id: 4,
    comment: 'The Menu is probably one the most strangest and yet extremely absurd thrillers that I\'ve ever seen.',
    grade: 8.0,
    comment_date: '2000-01-01'
  },
  {
    id: 13,
    user_id: 6,
    show_id: 9,
    comment: 'I was worried it wouldn\'t be able to compete with other versions of the addams family but WOW!',
    grade: null,
    comment_date: '2000-01-01'
  },
  {
    id: 14,
    user_id: 6,
    show_id: 15,
    comment: 'fajnie zimno',
    grade: 8.5,
    comment_date: '2000-01-01'
  },
  {
    id: 18,
    user_id: 6,
    show_id: 15,
    comment: 'Test czy komentarz się dodaje',
    grade: 6.0,
    comment_date: '2000-01-01'
  }
];

const USER_LIKES_DATA = [
  { id: 1, video_id: 6, user_id: 6 },
  { id: 4, video_id: 11, user_id: 1 },
  { id: 9, video_id: 11, user_id: 6 },
  { id: 23, video_id: 4, user_id: 6 },
  { id: 37, video_id: 7, user_id: 6 },
  { id: 44, video_id: 2, user_id: 6 }
];

function getDefaultThumbnail(type) {
  return type === 'series' 
    ? 'https://via.placeholder.com/300x445/333333/ffffff?text=Series'
    : 'https://via.placeholder.com/300x445/333333/ffffff?text=Movie';
}

async function clearDatabase() {
  console.log('Clearing existing data...');
  await prisma.userLike.deleteMany();
  await prisma.review.deleteMany();
  await prisma.seriesEpisode.deleteMany();
  await prisma.video.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleared.');
}

async function migrateFullData() {
  try {
    console.log('Starting full data migration...');

    // Clear existing data
    await clearDatabase();

    // Create ID mapping for foreign key relationships
    const userIdMap = new Map();
    const videoIdMap = new Map();

    // Migrate Users
    console.log('Migrating users...');
    for (const user of FULL_USER_DATA) {
      try {
        const newUser = await prisma.user.create({
          data: {
            username: user.username,
            fullname: user.fullname,
            password_hash: user.password,
            email: user.email,
            birthdate: user.birthdate ? new Date(user.birthdate) : null,
            confirmed: Boolean(user.confirmed),
            register_token: user.register_token || null,
            register_date: new Date(user.register_date),
            last_login: user.last_login ? new Date(user.last_login) : null,
            account_type: user.account_type
          }
        });
        userIdMap.set(user.id, newUser.id);
        console.log(`✓ Created user: ${user.username}`);
      } catch (error) {
        console.error(`✗ Failed to create user ${user.username}:`, error.message);
      }
    }

    // Migrate Videos
    console.log('Migrating videos...');
    for (const video of FULL_VIDEO_DATA) {
      try {
        // Ensure thumbnail has a fallback
        const thumbnailUrl = video.thumbnail && video.thumbnail.trim() 
          ? video.thumbnail 
          : getDefaultThumbnail(video.type);

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
            thumbnail: thumbnailUrl,
            grade: video.grade ? parseFloat(video.grade) : null,
            reviews_count: video.reviews_count || 0,
            views: video.views || 0,
            link: video.link || '',
            blocked_reviews: Boolean(video.blocked_reviews)
          }
        });
        videoIdMap.set(video.id, newVideo.id);
        console.log(`✓ Created video: ${video.title}`);
      } catch (error) {
        console.error(`✗ Failed to create video ${video.title}:`, error.message);
      }
    }

    // Migrate Episodes
    console.log('Migrating episodes...');
    for (const episode of EPISODE_DATA) {
      try {
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
          console.log(`✓ Created episode: ${episode.episode_name}`);
        } else {
          console.warn(`⚠ Skipping episode ${episode.episode_name}: Video ID ${episode.show_id} not found`);
        }
      } catch (error) {
        console.error(`✗ Failed to create episode ${episode.episode_name}:`, error.message);
      }
    }

    // Migrate Reviews
    console.log('Migrating reviews...');
    for (const review of REVIEW_DATA) {
      try {
        const userUuid = userIdMap.get(review.user_id);
        const videoUuid = videoIdMap.get(review.show_id);
        if (userUuid && videoUuid) {
          await prisma.review.create({
            data: {
              user_id: userUuid,
              video_id: videoUuid,
              comment: review.comment,
              grade: review.grade ? parseFloat(review.grade) : null,
              comment_date: new Date(review.comment_date)
            }
          });
          console.log(`✓ Created review for video ${review.show_id}`);
        } else {
          console.warn(`⚠ Skipping review: User ${review.user_id} or Video ${review.show_id} not found`);
        }
      } catch (error) {
        console.error(`✗ Failed to create review:`, error.message);
      }
    }

    // Migrate User Likes
    console.log('Migrating user likes...');
    for (const like of USER_LIKES_DATA) {
      try {
        const userUuid = userIdMap.get(like.user_id);
        const videoUuid = videoIdMap.get(like.video_id);
        if (userUuid && videoUuid) {
          await prisma.userLike.create({
            data: {
              user_id: userUuid,
              video_id: videoUuid
            }
          });
          console.log(`✓ Created like for user ${like.user_id} and video ${like.video_id}`);
        } else {
          console.warn(`⚠ Skipping like: User ${like.user_id} or Video ${like.video_id} not found`);
        }
      } catch (error) {
        console.error(`✗ Failed to create like:`, error.message);
      }
    }

    console.log('✅ Full data migration completed successfully!');
    
    // Print summary
    const userCount = await prisma.user.count();
    const videoCount = await prisma.video.count();
    const episodeCount = await prisma.seriesEpisode.count();
    const reviewCount = await prisma.review.count();
    const likeCount = await prisma.userLike.count();
    
    console.log('\n📊 Migration Summary:');
    console.log(`Users: ${userCount}`);
    console.log(`Videos: ${videoCount}`);
    console.log(`Episodes: ${episodeCount}`);
    console.log(`Reviews: ${reviewCount}`);
    console.log(`Likes: ${likeCount}`);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateFullData();
}

export { migrateFullData };
