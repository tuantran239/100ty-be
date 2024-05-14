import * as moment from 'moment';

export const formatDate = (date: any, format?: string) =>
  moment(new Date(date).toJSON()).format(format ?? 'DD/MM/YYYY');

export const convertPostgresDate = (date: string) =>
  date.split('/').reverse().join('-');

export const countFromToDate = (
  count: number,
  method: 'month' | 'day' | 'year',
  skip: number,
  startDate: string,
): any => {
  const dayMiliseconds = 24 * 60 * 60 * 1000;
  const monthMiliseconds = 31 * 24 * 60 * 60 * 1000;
  const yearMiliseconds = 365 * 24 * 60 * 60 * 1000;

  const skipDate = skip ?? 0;
  const countDate = count ?? 1;

  switch (method) {
    case 'day':
      const fromDateDay =
        new Date(startDate).getTime() + skipDate * dayMiliseconds;
      const toDateDay = fromDateDay + countDate * dayMiliseconds;
      return [new Date(fromDateDay), new Date(toDateDay)];
    case 'month':
      const fromDateMonth =
        new Date(startDate).getTime() + skipDate * monthMiliseconds;
      const toDatemonth = fromDateMonth + countDate * monthMiliseconds;
      return [new Date(fromDateMonth), new Date(toDatemonth)];
    case 'year':
      const fromDateYear =
        new Date(startDate).getTime() + skipDate * yearMiliseconds;
      const toDateYear = fromDateYear + countDate * yearMiliseconds;
      return [new Date(fromDateYear), new Date(toDateYear)];
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

  return month % 2 ? 30 : 31;
};

export const convertPrefixTime = (time: number) => {
  return time >= 10 ? time.toString() : `0${time}`;
};

export const calculateRangeTime = (
  data: { hour?: number; day?: number; month?: number; year?: number },
  type: 'hour' | 'day' | 'month' | 'year',
) => {
  const hour = convertPrefixTime(data.hour ?? new Date().getHours());
  const day = convertPrefixTime(data.day ?? new Date().getDate());
  const month = convertPrefixTime(data.month ?? new Date().getMonth() + 1);
  const year = data.year ?? new Date().getFullYear();
  const minute = new Date().getMinutes();
  const seconds = new Date().getSeconds();

  let fromDate = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${seconds}.000Z`,
  );
  let toDate = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${seconds}.000Z`,
  );

  switch (type) {
    case 'hour':
      fromDate = new Date(`${year}-${month}-${day}T${hour}:00:00.000Z`);
      toDate = new Date(`${year}-${month}-${day}T${hour}:59:59.999Z`);
      break;
    case 'day':
      fromDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      toDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
      break;
    case 'month':
      fromDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
      toDate = new Date(
        `${year}-${month}-${getTotalDayInMonth(parseInt(month), year)}T23:59:59.999Z`,
      );
      break;
    case 'year':
      fromDate = new Date(`${year}-01-01T00:00:00.000Z`);
      toDate = new Date(`${year}-12-31T23:59:59.999Z`);
      break;
    default:
      fromDate = new Date(`${year}-01-01T00:00:00.000Z`);
      toDate = new Date(`${year}-12-31T23:59:59.999Z`);
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
