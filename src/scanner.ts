import YahooFinance from "yahoo-finance2";
import { calculateRSI } from "./rsi";
import { NIFTY_50 } from "./stocks";

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
 * Fetch closing prices using period-based window
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
 * Scan all NIFTY 50 stocks for RSI condition
 */
export async function scanStocks(): Promise<string[]> {
  const alerts: string[] = [];

  for (const symbol of NIFTY_50) {
    try {
      // Lookback windows (safe for RSI 14)
      const dailyCloses = await fetchCloses(symbol, "1d", 180);   // ~6 months
      const weeklyCloses = await fetchCloses(symbol, "1wk", 730); // ~2 years
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

      const dailyPrev = dailyRSI[dailyRSI.length - 2];
      const dailyNow = dailyRSI[dailyRSI.length - 1];
      const weeklyNow = weeklyRSI[weeklyRSI.length - 1];
      const monthlyNow = monthlyRSI[monthlyRSI.length - 1];

      if (
        monthlyNow > 60 &&
        weeklyNow > 60 &&
        dailyPrev < 40 &&
        dailyNow > dailyPrev
      ) {
        alerts.push(symbol);
      }
    } catch (err) {
      console.error(`Error scanning ${symbol}`);
    }
  }

  return alerts;
}
