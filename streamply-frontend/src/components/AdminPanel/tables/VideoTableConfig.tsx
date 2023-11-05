import { ReactNode } from 'react';
import { Video } from '../../../store/videos.types';

export type VideoActionsConfigType = {
  icon: ReactNode;
  action: (title: string) => void;
  actionDescription: string;
};

export type TableConfig = {
  data: Video[];
  columnNames: string[];
  actions: VideoActionsConfigType[];
};

//columns for movies and series table
export const tableColumns = ['Thumbnail', 'Title', 'Genre', 'Grade', 'Actions'];
