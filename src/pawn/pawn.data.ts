import { PawnInterestType, PawnPaymentPeriodType } from './pawn.type';

export const InitPeriodTypeData = [
  {
    label: 'Ngày',
    value: PawnPaymentPeriodType.DAY,
    key: PawnPaymentPeriodType.DAY,
    interest_type: [
      {
        label: 'Lãi/Triệu/Ngày',
        value: PawnInterestType.LOAN_MIL_DAY,
        key: `${PawnPaymentPeriodType.DAY}_${PawnInterestType.LOAN_MIL_DAY}`,
      },
      {
        label: 'Lãi/Ngày',
        value: PawnInterestType.LOAN_DAY,
        key: `${PawnPaymentPeriodType.DAY}_${PawnInterestType.LOAN_DAY}`,
      },
      {
        label: 'Lãi%/Tháng',
        value: PawnInterestType.LOAN_PERCENT_MONTH,
        key: `${PawnPaymentPeriodType.DAY}_${PawnInterestType.LOAN_PERCENT_MONTH}`,
      },
      {
        label: 'Lãi Kỳ',
        value: PawnInterestType.LOAN_PERIOD,
        key: `${PawnPaymentPeriodType.DAY}_${PawnInterestType.LOAN_PERIOD}`,
      },
      {
        label: 'Lãi % Định Kỳ',
        value: PawnInterestType.LOAN_PERCENT_PERIOD,
        key: `${PawnPaymentPeriodType.DAY}_${PawnInterestType.LOAN_PERCENT_PERIOD}`,
      },
    ],
  },
  {
    label: 'Tuần',
    value: PawnPaymentPeriodType.WEEK,
    key: PawnPaymentPeriodType.WEEK,
    interest_type: [
      {
        label: 'Lãi Tuần',
        value: PawnInterestType.LOAN_WEEK,
        key: `${PawnPaymentPeriodType.WEEK}_${PawnInterestType.LOAN_WEEK}`,
      },
      {
        label: 'Lãi %/Tuần',
        value: PawnInterestType.LOAN_PERCENT_WEEK,
        key: `${PawnPaymentPeriodType.DAY}_${PawnInterestType.LOAN_PERCENT_WEEK}`,
      },
    ],
  },
  {
    label: 'Tháng',
    value: PawnPaymentPeriodType.MOTH,
    key: PawnPaymentPeriodType.MOTH,
    interest_type: [
      {
        label: 'Lãi/Triệu/Ngày',
        value: PawnInterestType.LOAN_MIL_DAY,
        key: `${PawnPaymentPeriodType.MOTH}_${PawnInterestType.LOAN_MIL_DAY}`,
      },
      {
        label: 'Lãi/Ngày',
        value: PawnInterestType.LOAN_DAY,
        key: `${PawnPaymentPeriodType.MOTH}_${PawnInterestType.LOAN_DAY}`,
      },
      {
        label: 'Lãi%/Tháng',
        value: PawnInterestType.LOAN_PERCENT_MONTH,
        key: `${PawnPaymentPeriodType.MOTH}_${PawnInterestType.LOAN_PERCENT_MONTH}`,
      },
    ],
  },
  {
    label: 'Tháng Định Kì',
    value: PawnPaymentPeriodType.REGULAR_MOTH,
    key: PawnPaymentPeriodType.REGULAR_MOTH,
    interest_type: [
      {
        label: 'Lãi%/Tháng',
        value: PawnInterestType.LOAN_PERCENT_MONTH,
        key: `${PawnPaymentPeriodType.REGULAR_MOTH}_${PawnInterestType.LOAN_PERCENT_MONTH}`,
      },
    ],
  },
];
