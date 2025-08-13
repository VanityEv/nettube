/**
 * Helper functions for genre handling and filtering
 */

/**
 * Splits comma-separated genres and normalizes them (case-insensitive)
 * @param genreString - The genre string from database (e.g., "Documentary, Music")
 * @returns Array of normalized genre strings
 */
export const parseGenres = (genreString: string): string[] => {
  if (!genreString) return [];
  
  return genreString
    .split(',')
    .map(genre => genre.trim())
    .filter(Boolean)
    .map(genre => genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase());
};

/**
 * Checks if a video matches any of the selected genres (case-insensitive)
 * @param videoGenre - The genre string from the video (e.g., "Documentary, Music")
 * @param selectedGenres - Array of selected genres to filter by
 * @returns true if video matches any selected genre
 */
export const videoMatchesGenres = (videoGenre: string, selectedGenres: string[]): boolean => {
  if (!selectedGenres || selectedGenres.length === 0) return true;
  if (!videoGenre) return false;
  
  const videoGenres = parseGenres(videoGenre);
  const normalizedSelectedGenres = selectedGenres.map(genre => 
    genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase()
  );
  
  return videoGenres.some(genre => 
    normalizedSelectedGenres.includes(genre)
  );
};

/**
 * Gets all unique genres from a list of videos
 * @param videos - Array of videos
 * @returns Sorted array of unique genres
 */
export const extractUniqueGenres = (videos: Array<{ genre?: string }>): string[] => {
  const allGenres = videos.flatMap(video => parseGenres(video.genre || ''));
  const uniqueGenres = new Set(allGenres);
  return Array.from(uniqueGenres).sort();
};

/**
 * Filters videos by selected genres (case-insensitive, supports comma-separated genres)
 * @param videos - Array of videos to filter
 * @param selectedGenres - Array of selected genres
 * @returns Filtered array of videos
 */
export const filterVideosByGenres = <T extends { genre?: string }>(
  videos: T[], 
  selectedGenres: string[]
): T[] => {
  if (!selectedGenres || selectedGenres.length === 0) return videos;
  
  return videos.filter(video => videoMatchesGenres(video.genre || '', selectedGenres));
};
