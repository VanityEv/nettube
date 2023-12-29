import Ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

Ffmpeg.setFfmpegPath(ffmpegInstaller.path);

Ffmpeg('videos/teya-dora-dzanum.mp4', { timeout: 432000 })
  .addOptions(['-profile:v baseline', '-level 3.0', '-start_number 0', '-hls_time 10', '-hls_list_size 0', '-f hls'])
  .output('videos/teya_dora.m3u8')
  .on('end', () => {
    console.log('end');
  })
  .run();
