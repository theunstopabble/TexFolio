import { env } from "../config/env.js";

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  pdfBuffer?: Buffer;
  pdfName?: string;
}

export const sendEmail = async ({
  to,
  subject,
  htmlContent,
  pdfBuffer,
  pdfName = "resume.pdf",
}: SendEmailParams) => {
  if (!env.BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY is missing");
    throw new Error("Email service is not configured");
  }

  const payload: any = {
    sender: {
      name: "TexFolio",
      email: env.SENDER_EMAIL || "no-reply@texfolio.vercel.app",
    },
    to: [{ email: to }],
    subject,
    htmlContent,
  };

  // Attach PDF if provided
  if (pdfBuffer) {
    payload.attachment = [
      {
        name: pdfName,
        content: pdfBuffer.toString("base64"),
      },
    ];
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Brevo API Error:", error);
      throw new Error("Failed to send email");
    }

    console.log(`📧 Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Email Service Error:", error);
    throw error;
  }
};
