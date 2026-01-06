import { RSI } from "technicalindicators";

export function calculateRSI(closes: number[]): number[] {
  return RSI.calculate({
    period: 14,
    values: closes
  });
}
