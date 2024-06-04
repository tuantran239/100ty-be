import * as moment from 'moment';
import { TimeZone } from '../constant/timezone';

export const formatDate = (date: any, format?: string) =>
  moment(new Date(date).toJSON()).format(format ?? 'DD/MM/YYYY');

export const convertPostgresDate = (date: string) =>
  date.split('/').reverse().join('-');

const calculateRangeDay = (date: Date, range: number) => {
  const dayMiliSeconds = 24 * 60 * 60 * 1000;

  return new Date(new Date(date).getTime() + range * dayMiliSeconds);
};

export const calculateRangeMonth = (date: Date, range: number) => {
  const month = date.getMonth() + 1;

  const year = date.getFullYear();

  const yearOfMonthRange =
    month + range > 12 ? (month + range - ((month + range) % 12)) / 12 : 0;

  const monthRange =
    yearOfMonthRange > 0
      ? month + range - 12 * yearOfMonthRange
      : month + range;

  const yearRange = yearOfMonthRange > 0 ? year + yearOfMonthRange : year;

  return new Date(
    `${yearRange}-${convertPrefixTime(monthRange)}-${convertPrefixTime(date.getDate())}`,
  );
};

export const calculateRangeYear = (date: Date, range: number) => {
  const month = date.getMonth() + 1;

  const year = date.getFullYear() + range;

  return new Date(
    `${year}-${convertPrefixTime(month)}-${convertPrefixTime(date.getDate())}`,
  );
};

export const countFromToDate = (
  count: number,
  method: 'month' | 'day' | 'year',
  skip: number,
  startDate: string,
): any => {
  const skipDate = skip ?? 0;
  const countDate = count ?? 1;

  switch (method) {
    case 'day':
      const fromDateDay = calculateRangeDay(new Date(startDate), skipDate);
      const toDateDay = calculateRangeDay(new Date(fromDateDay), countDate);
      return [fromDateDay, toDateDay];
    case 'month':
      const fromDateMonth = calculateRangeMonth(new Date(startDate), skipDate);
      const toDatemonth = calculateRangeMonth(
        new Date(fromDateMonth),
        countDate,
      );
      return [fromDateMonth, toDatemonth];
    case 'year':
      const fromDateYear = calculateRangeYear(new Date(startDate), skipDate);
      const toDateYear = calculateRangeYear(new Date(fromDateYear), countDate);
      return [fromDateYear, toDateYear];
    default:
      return [new Date(), new Date()];
  }
};

export const countTimeMustPay = (endDate: string) => {
  const dayMiliseconds = 24 * 60 * 60 * 1000;

  const today = new Date(convertPostgresDate(formatDate(new Date()))).getTime();
  const end = new Date(convertPostgresDate(formatDate(endDate))).getTime();

  const rangeDate = end - today;

  if (rangeDate === 0) {
    return 'Hôm nay';
  } else if (rangeDate === dayMiliseconds) {
    return 'Ngày mai';
  }

  return formatDate(endDate);
};

export const getTotalDayInMonth = (month: number, year: number) => {
  if (month > 12 || month <= 0) {
    return 0;
  }
  if (month === 2) {
    return year % 4 ? 29 : 28;
  }
  if (month >= 8) {
    return month % 2 === 0 ? 31 : 30;
  }

  return month % 2 === 0 ? 30 : 31;
};

export const convertPrefixTime = (time: number) => {
  return time >= 10 ? time.toString() : `0${time}`;
};

export const calculateRangeTime = (
  data: { hour?: number; day?: number; month?: number; year?: number },
  type: 'hour' | 'day' | 'month' | 'year',
  timezone?: string,
) => {
  const hour = convertPrefixTime(data.hour ?? new Date().getHours());
  const day = convertPrefixTime(data.day ?? new Date().getDate());
  const month = convertPrefixTime(data.month ?? new Date().getMonth() + 1);
  const year = data.year ?? new Date().getFullYear();
  const minute = new Date().getMinutes();
  const seconds = new Date().getSeconds();

  const localTime = TimeZone[timezone ?? 'vn'];

  let fromDate = new Date(
    `${year}-${month}-${day} ${hour}:${minute}:${seconds}.000${localTime}`,
  );
  let toDate = new Date(
    `${year}-${month}-${day} ${hour}:${minute}:${seconds}.000${localTime}`,
  );

  switch (type) {
    case 'hour':
      fromDate = new Date(
        `${year}-${month}-${day} ${hour}:00:00.000${localTime}`,
      );
      toDate = new Date(
        `${year}-${month}-${day} ${hour}:59:59.999${localTime}`,
      );
      break;
    case 'day':
      fromDate = new Date(`${year}-${month}-${day} 00:00:00.000${localTime}`);
      toDate = new Date(`${year}-${month}-${day} 23:59:59.999${localTime}`);
      break;
    case 'month':
      fromDate = new Date(`${year}-${month}-01 00:00:00.000${localTime}`);
      toDate = new Date(
        `${year}-${month}-${getTotalDayInMonth(parseInt(month), year)} 23:59:59.999${localTime}`,
      );
      break;
    case 'year':
      fromDate = new Date(`${year}-01-01 00:00:00.000${localTime}`);
      toDate = new Date(`${year}-12-31 23:59:59.999${localTime}`);
      break;
    default:
      fromDate = new Date(`${year}-01-01 00:00:00.000${localTime}`);
      toDate = new Date(`${year}-12-31 23:59:59.999${localTime}`);
  }

  return { fromDate, toDate };
};

export const calculateRangeDate = (
  data: { day?: number; month?: number; year?: number },
  type: 'day' | 'month' | 'year',
) => {
  const day = convertPrefixTime(data.day ?? new Date().getDate());
  const month = convertPrefixTime(data.month ?? new Date().getMonth() + 1);
  const year = data.year ?? new Date().getFullYear();

  let fromDate = `${year}-${month}-${day}`;
  let toDate = `${year}-${month}-${day}`;

  switch (type) {
    case 'day':
      fromDate = `${year}-${month}-${day}`;
      toDate = `${year}-${month}-${day}`;
      break;
    case 'month':
      fromDate = `${year}-${month}-01`;
      toDate = `${year}-${month}-${getTotalDayInMonth(parseInt(month), year)}`;
      break;
    case 'year':
      fromDate = `${year}-01-01`;
      toDate = `${year}-12-31`;
      break;
    default:
      fromDate = `${year}-01-01`;
      toDate = `${year}-12-31`;
  }

  return { fromDate, toDate };
};

export const calculateTotalDayRangeDate = (startDate: Date, endDate: Date) => {
  const startDateTime = startDate.getTime();
  const endDateTime = endDate.getTime();

  const timeOneDay = 24 * 60 * 60 * 1000;

  const rangeDay = Math.round((endDateTime - startDateTime) / timeOneDay);

  return rangeDay === 0 ? 1 : rangeDay;
};

export const getTodayNotTimeZone = () => {
  const today = new Date();

  return new Date(
    `${today.getFullYear()}-${convertPrefixTime(today.getMonth() + 1)}-${convertPrefixTime(today.getDate())}`,
  );
};

export const getDateLocal = (date: Date) => {
  return `${date.getFullYear()}-${convertPrefixTime(date.getMonth() + 1)}-${convertPrefixTime(date.getDate())}`;
};
