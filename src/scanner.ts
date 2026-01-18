import YahooFinance from "yahoo-finance2";
import { calculateRSI } from "./rsi";
import { STOCKS } from "./stocks";

const yf = new YahooFinance();

/**
 * Helper: get YYYY-MM-DD string for N days ago
 */
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

/**
 * Fetch closing prices (TypeScript-safe, no deprecated APIs)
 */
async function fetchCloses(
  symbol: string,
  interval: "1d" | "1wk" | "1mo",
  lookbackDays: number
): Promise<number[]> {
  const result = await yf.chart(symbol, {
    interval,
    period1: daysAgo(lookbackDays),
    period2: new Date().toISOString().split("T")[0]
  });

  if (!result?.quotes || result.quotes.length === 0) {
    return [];
  }

  return result.quotes
    .map(q => q.close)
    .filter((c): c is number => typeof c === "number");
}

/**
 * Detect RSI bottom reversal:
 * - RSI dipped below 40
 * - Formed a bottom
 * - RSI is now rising from that bottom
 */
function hasDailyRSIBottomReversal(dailyRSI: number[]): boolean {
  const LOOKBACK = 15;

  if (dailyRSI.length < LOOKBACK + 2) return false;

  const recentRSI = dailyRSI.slice(-LOOKBACK);

  const minRSI = Math.min(...recentRSI);
  const minIndex = recentRSI.indexOf(minRSI);

  const dippedBelow40 = minRSI < 40;
  const bottomNotLatest = minIndex < recentRSI.length - 1;
  const isRisingFromBottom =
    recentRSI[recentRSI.length - 1] > recentRSI[minIndex];

  return dippedBelow40 && bottomNotLatest && isRisingFromBottom;
}

/**
 * Scan all stocks
 */
export async function scanStocks(): Promise<string[]> {
  const alerts: string[] = [];

  for (const symbol of STOCKS) {
    try {
      // Lookback windows
      const dailyCloses = await fetchCloses(symbol, "1d", 180);    // ~6 months
      const weeklyCloses = await fetchCloses(symbol, "1wk", 730);  // ~2 years
      const monthlyCloses = await fetchCloses(symbol, "1mo", 1825); // ~5 years

      if (
        dailyCloses.length < 20 ||
        weeklyCloses.length < 20 ||
        monthlyCloses.length < 20
      ) {
        continue;
      }

      const dailyRSI = calculateRSI(dailyCloses);
      const weeklyRSI = calculateRSI(weeklyCloses);
      const monthlyRSI = calculateRSI(monthlyCloses);

      const weeklyNow = weeklyRSI[weeklyRSI.length - 1];
      const monthlyNow = monthlyRSI[monthlyRSI.length - 1];

      const dailyBottomReversal = hasDailyRSIBottomReversal(dailyRSI);

      if (
        monthlyNow > 60 &&
        weeklyNow > 60 &&
        dailyBottomReversal
      ) {
        alerts.push(symbol);
      }
    } catch (err) {
      console.error(`Error scanning ${symbol}`);
    }
  }

  return alerts;
}
