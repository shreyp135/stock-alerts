import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function sendEmail(stocks: string[]) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const message = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: "NIFTY RSI ALERT",
    text:
      "RSI Alert triggered for:\n\n" +
      stocks.join("\n")
  };

  await transporter.sendMail(message);
}
