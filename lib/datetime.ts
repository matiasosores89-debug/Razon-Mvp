export const SHOP_TIME_ZONE = "America/Argentina/Buenos_Aires";

const ARGENTINA_OFFSET = "-03:00";

export function getShopDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function shopLocalDateTimeToIso(value: string): string {
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return new Date(`${withSeconds}${ARGENTINA_OFFSET}`).toISOString();
}

export function shopDateTime(date: string, time: string): Date {
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}${ARGENTINA_OFFSET}`);
}

export function getShopDayBounds(date: string): { start: Date; end: Date } {
  return {
    start: shopDateTime(date, "00:00"),
    end: shopDateTime(date, "23:59:59.999"),
  };
}

export function formatForShopDateTimeInput(value: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
