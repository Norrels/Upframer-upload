export interface EmailNotificationData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface EmailNotificationPort {
  sendEmail(data: EmailNotificationData): Promise<void>;
}