import nodemailer from 'nodemailer';

export interface NotificationPayload {
    subject: string;
    body: string;
}

/**
 * Sends an email notification via Gmail SMTP.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD in the environment variables.
 */
export async function sendGmailNotification(payload: NotificationPayload): Promise<void> {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        console.warn('Gmail credentials not found. Skipping notification.');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });

        const mailOptions = {
            from: `"Job Hunt Agent" <${user}>`,
            to: user, // Sends to yourself
            subject: payload.subject,
            html: payload.body,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Notification sent successfully: ${info.messageId}`);
    } catch (error) {
        console.error('Failed to send Gmail notification:', error);
    }
}
