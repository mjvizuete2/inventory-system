export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const money = (value: number): string => roundMoney(value).toFixed(2);
