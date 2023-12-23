import dayjs from 'dayjs';

export const convertDate = (date: string) => {
  const newDate = dayjs(date);
  return newDate.add(1, 'h').format('YYYY-MM-DD');
};
