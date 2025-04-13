import { createTransport } from "nodemailer";

const sendEmail = async (to, subject, text,html='') => {
  
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const option = {
    to,
    subject
  }

  if(html){
    option.html = html;
  }

  if(text){
    option.text = text;
  }

  await transporter.sendMail(option);
};

export default sendEmail;