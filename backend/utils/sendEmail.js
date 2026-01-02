import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Validate required parameters
    if (!to) {
      console.error("sendEmail error: 'to' parameter is missing or empty");
      throw new Error("Recipient email address is required");
    }
    if (!subject) {
      console.error("sendEmail error: 'subject' parameter is missing");
      throw new Error("Email subject is required");
    }
    if (!text && !html) {
      console.error("sendEmail error: 'text' or 'html' parameter is required");
      throw new Error("Email body (text or html) is required");
    }

    console.log("Sending email to:", to);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"InnovateX Hub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
    };

    // Use html if provided, otherwise use text
    if (html) {
      mailOptions.html = html;
    } else {
      mailOptions.text = text;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", to, "Response:", info.response);
    return info;
  } catch (error) {
    console.error("Email sending error:", error.message);
    throw error;
  }
};

export default sendEmail;
