import { endpoints } from './endpoints';

export const userApi = {
  list: endpoints.users,
  detail: (id: number | string) => `${endpoints.users}/${id}`,
};
