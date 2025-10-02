import nodemailer from "nodemailer";
import {
  EmailNotificationPort,
  EmailNotificationData,
} from "../../../../domain/ports/out/notification/email-notification.port";
import { config } from "../../../../env";

export class EmailNotificationAdapter implements EmailNotificationPort {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }

  async sendEmail(data: EmailNotificationData): Promise<void> {
    try {
      const mailOptions = {
        from: config.SMTP_USER,
        to: data.to,
        subject: data.subject,
        html: data.htmlContent,
        text: data.textContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error(
        `Failed to send email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("SMTP connection verified successfully");
      return true;
    } catch (error) {
      console.error("SMTP connection verification failed:", error);
      return false;
    }
  }
}
