import nodemailer from "nodemailer";
import { config } from "../core/config";
import { logger } from "../core/config/logger";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: config.email.user
    ? { user: config.email.user, pass: config.email.pass }
    : undefined,
});

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: config.email.from,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.debug("Email sent", { to: options.to, subject: options.subject });
  } catch (err) {
    logger.error("Failed to send email", {
      error: (err as Error).message,
      to: options.to,
    });
  }
}

export function verificationOtpEmail(name: string, otp: string, expiryMinutes: number): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #111827; font-size: 22px; margin: 0;">Digital Knowledge Platform</h1>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">University of Dhaka Academic Hub</p>
      </div>
      <div style="background: #fff; border-radius: 10px; padding: 28px; border: 1px solid #e5e7eb;">
        <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #374151; font-size: 14px; margin: 0 0 24px;">
          Use the verification code below to complete your registration. It expires in <strong>${expiryMinutes} minutes</strong>.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #1a1a2e; color: #fff; font-size: 36px; font-weight: 800; letter-spacing: 12px; padding: 16px 32px; border-radius: 10px;">
            ${otp}
          </div>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0; text-align: center;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    </div>`;
}

export function accountApprovalEmail(name: string, approved: boolean, reason?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px;">
      <h1 style="color: #111827; font-size: 22px;">Digital Knowledge Platform</h1>
      <div style="background: #fff; border-radius: 10px; padding: 28px; border: 1px solid #e5e7eb;">
        <p>Hi <strong>${name}</strong>,</p>
        ${approved
          ? `<p>Your <strong>Researcher</strong> account has been <span style="color:#16a34a;font-weight:700;">approved</span>. You can now sign in and access all researcher features.</p>
             <p style="text-align:center;margin:24px 0;"><a href="${config.frontendUrl}/login" style="background:#111827;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">Sign In</a></p>`
          : `<p>Unfortunately your Researcher account request was <span style="color:#dc2626;font-weight:700;">not approved</span>.</p>
             ${reason ? `<p style="color:#6b7280;">Reason: ${reason}</p>` : ""}
             <p>If you believe this is an error, please contact the platform administrator.</p>`
        }
      </div>
    </div>`;
}

export function dueDateReminderEmail(
  memberName: string,
  bookTitle: string,
  dueDate: string,
  daysLeft: number
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a56db;">Digital Knowledge Platform</h2>
      <p>Dear ${memberName},</p>
      <p>This is a reminder that the following book is due ${daysLeft === 0 ? "today" : `in ${daysLeft} day(s)`}:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <strong>${bookTitle}</strong><br/>
        <span style="color: #6b7280;">Due Date: ${dueDate}</span>
      </div>
      <p>Please return the book on time to avoid fines (Tk ${config.library.fineRatePerDay}/day).</p>
      <p>Visit the <a href="${config.frontendUrl}/dashboard">Member Dashboard</a> to view your borrowing history.</p>
      <hr/>
      <p style="color: #9ca3af; font-size: 12px;">Digital Knowledge Platform — University of Dhaka, CSE Department</p>
    </div>
  `;
}

export function projectApprovalEmail(
  studentName: string,
  projectTitle: string,
  approved: boolean,
  comments?: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a56db;">Digital Knowledge Platform</h2>
      <p>Dear ${studentName},</p>
      <p>Your project submission <strong>"${projectTitle}"</strong> has been 
        <strong style="color: ${approved ? "#059669" : "#dc2626"}">
          ${approved ? "approved" : "returned for changes"}
        </strong>.
      </p>
      ${comments ? `<div style="background: #f3f4f6; padding: 16px; border-radius: 8px;"><strong>Advisor Comments:</strong><p>${comments}</p></div>` : ""}
      <p>Visit the <a href="${config.frontendUrl}/showcase">Student Showcase</a> to view your project.</p>
    </div>
  `;
}

export function holdAvailableEmail(
  memberName: string,
  bookTitle: string,
  pickupDeadline: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a56db;">Digital Knowledge Platform</h2>
      <p>Dear ${memberName},</p>
      <p>Good news! The book you placed a hold on is now available:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <strong>${bookTitle}</strong><br/>
        <span style="color: #6b7280;">Please pick up by: ${pickupDeadline}</span>
      </div>
      <p>Visit the library to collect your book.</p>
    </div>
  `;
}
