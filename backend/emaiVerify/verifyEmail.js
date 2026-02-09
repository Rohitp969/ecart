import express from "express";
import nodemailer from "nodemailer";
import "dotenv/config";

export const verifyEmail = (token, email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailConfigurations = {
    from: process.env.Mail_User,
    to: email,
    subject: "Email Verification",

    //this would be the text of email body
    text: `Hi! There, You have recently visited our websited and entered your email 
               please follow the given link to verify your email http://localhost:5173/verify/${token} Thanks`,
  };
  
  transporter.sendMail(mailConfigurations, function (error, info) {
    if (error) throw Error(error);
    console.log("Email Send Successfully");
    console.log(info);
  });
};
