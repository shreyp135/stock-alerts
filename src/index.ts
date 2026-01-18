import dotenv from "dotenv";
import { scanStocks } from "./scanner";
import { sendEmail } from "./mailer";

dotenv.config();

export async function job(req:any,res:any){
  
  console.log("NIFTY RSI scanner running...");
  
  const alerts = await scanStocks();

  if (alerts.length > 0) {
    await sendEmail(alerts);
    console.log("Email sent:", alerts);

  } else {
    await sendEmail([]);
    console.log("No alerts");
  }

  console.log("NIFTY RSI scan finished");
  res.status(200).send("Done");
}

