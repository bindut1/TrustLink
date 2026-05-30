import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass || pass === 'your_app_password') {
      this.logger.warn(
        'SMTP not fully configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing). Email service falls back to console logging.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(this.config.get<string>('SMTP_PORT') ?? '587', 10),
      secure: false,
      auth: { user, pass },
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const subject = 'TrustLink — Reset your password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Reset your password</h2>
        <p>Hi,</p>
        <p>We received a request to reset your TrustLink password. Click the button below to set a new one:</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset password
          </a>
        </p>
        <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #6b7280; font-size: 14px;">
          This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;
    await this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[MOCK EMAIL] to=${to} subject="${subject}"`);
      return;
    }
    try {
      const from =
        this.config.get<string>('SMTP_FROM') ||
        `TrustLink <${this.config.get<string>('SMTP_USER')}>`;
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${to}: ${(err as Error).message}`,
      );
    }
  }
}
