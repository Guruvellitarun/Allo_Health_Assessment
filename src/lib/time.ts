export const RESERVATION_TTL_MINUTES = 10;

export const nowUtc = (): Date => new Date();

export const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60 * 1000);
