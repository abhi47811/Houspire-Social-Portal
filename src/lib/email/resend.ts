import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResendClient(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL || "Houspire <notifications@houspire.ai>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://houspire-social-portal.vercel.app";

export type EmailType = "task_assigned" | "deadline_warning" | "publish_success" | "status_changed";

interface EmailPayload {
  to: string;
  type: EmailType;
  data: {
    recipientName?: string;
    taskTitle: string;
    taskId?: string;
    taskStatus?: string;
    platform?: string;
    actionUrl?: string;
    extra?: string;
  };
}

function buildHtml(subject: string, body: string, ctaLabel: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1)">
    <div style="background:#1e40af;padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:20px">Houspire Social Portal</h1>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 16px;font-size:18px;color:#111">${subject}</h2>
      <p style="color:#444;line-height:1.6;margin:0 0 24px">${body}</p>
      <a href="${ctaUrl}" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">${ctaLabel}</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;font-size:12px;color:#999">
      You're receiving this because you're a member of the Houspire Social Portal team.
    </div>
  </div>
</body>
</html>`;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const resend = getResendClient();
  const { to, type, data } = payload;
  const name = data.recipientName || "Team Member";
  const taskUrl = data.actionUrl || `${APP_URL}/tasks`;

  let subject = "";
  let bodyHtml = "";
  let ctaLabel = "View Task";

  switch (type) {
    case "task_assigned":
      subject = `You've been assigned: ${data.taskTitle}`;
      bodyHtml = `Hi ${name},<br><br>You've been assigned a new task: <strong>${data.taskTitle}</strong>${data.platform ? ` (${data.platform})` : ""}.<br><br>Click below to view the task and get started.`;
      ctaLabel = "View Task";
      break;

    case "deadline_warning":
      subject = `Deadline approaching: ${data.taskTitle}`;
      bodyHtml = `Hi ${name},<br><br>Your task <strong>${data.taskTitle}</strong> is approaching its deadline${data.taskStatus ? ` and is currently <em>${data.taskStatus}</em>` : ""}.<br><br>Please take action to keep things on track.`;
      ctaLabel = "View Task";
      break;

    case "publish_success":
      subject = `Published: ${data.taskTitle}`;
      bodyHtml = `Great news! Your content <strong>${data.taskTitle}</strong> has been published successfully${data.platform ? ` to ${data.platform}` : ""}.${data.extra ? `<br><br>${data.extra}` : ""}`;
      ctaLabel = "View Results";
      break;

    case "status_changed":
      subject = `Status update: ${data.taskTitle}`;
      bodyHtml = `Hi ${name},<br><br>The task <strong>${data.taskTitle}</strong> status has changed to <strong>${data.taskStatus}</strong>.${data.extra ? `<br><br>${data.extra}` : ""}`;
      ctaLabel = "View Task";
      break;
  }

  const html = buildHtml(subject, bodyHtml, ctaLabel, taskUrl);

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });
}
