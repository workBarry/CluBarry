import { endpoints } from './endpoints';

export const eventApi = {
  list: endpoints.events,
  detail: (id: number | string) => `${endpoints.events}/${id}`,
};
