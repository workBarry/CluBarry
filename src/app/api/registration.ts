import { endpoints } from './endpoints';

export const registrationApi = {
  list: endpoints.registrations,
  detail: (id: number | string) => `${endpoints.registrations}/${id}`,
};
