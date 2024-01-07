import { ReactNode } from 'react';
import { Video } from '../../../types/videos.types';

type ActionFunction = ((title: string) => void) | ((id: number, targetStatus: number) => void);

export type VideoActionsConfigType = {
  icon: ReactNode;
  action: ActionFunction;
  actionDescription: string;
};

export type TableConfig = {
  data: Video[];
  columnNames: string[];
  actions: VideoActionsConfigType[];
};

//columns for movies and series table
export const tableColumns = ['Thumbnail', 'Title', 'Genre', 'Grade', 'Actions'];
