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
  let textdata;
  if (stocks.length === 0) {
    textdata = "No stocks found today matching the condition.";
  }else {
    textdata = "RSI Alert triggered for:\n\n" + stocks.join("\n");
  }

  const message = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    cc: process.env.EMAIL_CC,
    subject: "Stock Market RSI Alert by Shreyansh",
    text: textdata
  };

  await transporter.sendMail(message);
}
