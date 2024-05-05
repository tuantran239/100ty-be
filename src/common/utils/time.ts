import * as moment from 'moment';

export const formatDate = (date: any, format?: string) =>
  moment(new Date(date)).format(format ?? 'DD/MM/YYYY');

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
