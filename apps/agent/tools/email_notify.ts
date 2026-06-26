import { Resend } from 'resend';

export interface NotificationPayload {
  subject: string;
  body: string;
}

/**
 * Sends an email notification via Resend API.
 * Requires RESEND_API_KEY and EMAIL_TO in the environment variables.
 */
export async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.EMAIL_TO;

  if (!apiKey || !emailTo) {
    console.warn('Resend credentials not found. Skipping notification.');
    return;
  }

  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: 'Job Hunt Agent <onboarding@resend.dev>', // Resend testing domain
      to: emailTo,
      subject: payload.subject,
      html: payload.body,
    });

    if (error) {
      console.error(
        'Failed to send Resend notification:',
        error instanceof Error ? error.message : error
      );
      return;
    }

    console.log(`Notification sent successfully via Resend: ${data?.id}`);
  } catch (error) {
    console.error(
      'Failed to send Resend notification:',
      error instanceof Error ? error.message : error
    );
  }
}
