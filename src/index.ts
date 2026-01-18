// import cron from "node-cron";
import dotenv from "dotenv";
import { scanStocks } from "./scanner";
import { sendEmail } from "./mailer";

dotenv.config();

async function job() {
  const alerts = await scanStocks();
  if (alerts.length > 0) {
    await sendEmail(alerts);
    console.log("Email sent:", alerts);

  } else {
    await sendEmail([]);
    console.log("No alerts");
  }
}

// cron.schedule("0 20 * * *", job, {
//   timezone: "Asia/Kolkata"
// });

console.log("NIFTY RSI scanner running...");
// job();
