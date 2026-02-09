import express from "express";
import nodemailer from "nodemailer";
import "dotenv/config";

export const sendOTPMail =async (otp, email) => {
    try{
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailConfigurations = {
   from: process.env.MAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    html: `<p>Your OTP for password reset is <b>${otp}</b></p>`
  }

    await transporter.sendMail(mailConfigurations);
    console.log("✅ OTP sent successfully");
  } catch (error) {
    console.error("❌ Failed to send OTP:", error.message);
  }
};