import nodemailer from "nodemailer";
import { env } from "~/env";

type SendAuthEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function isDevelopmentEmailPlaceholder() {
  return (
    env.NODE_ENV !== "production" &&
    (env.SMTP_HOST === "localhost" ||
      env.SMTP_USER === "dev@example.com" ||
      env.SMTP_PASSWORD === "dev-password" ||
      env.SMTP_FROM_EMAIL.endsWith(".test"))
  );
}

function extractUrlFromText(text: string) {
  const urlRegex = /https?:\/\/\S+/;
  const match = urlRegex.exec(text);

  return match?.[0] ?? null;
}

export async function sendAuthEmail({
  to,
  subject,
  text,
  html,
}: SendAuthEmailInput) {
  if (env.EMAIL_DELIVERY_MODE === "log" || isDevelopmentEmailPlaceholder()) {
    const url = extractUrlFromText(text);

    console.warn("\n[EMAIL LOG - NOT SENT]");
    console.warn(`To: ${to}`);
    console.warn(`Subject: ${subject}`);

    if (url) {
      console.warn(`Open this link in your browser:\n${url}`);
    } else {
      console.warn(text);
    }

    console.warn("[END EMAIL LOG]\n");

    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    text,
    html,
  });
}
