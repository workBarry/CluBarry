import { endpoints } from './endpoints';

export const announcementApi = {
  list: endpoints.announcements,
  detail: (id: number | string) => `${endpoints.announcements}/${id}`,
};
