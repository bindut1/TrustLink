import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = parseInt(this.config.get<string>('SMTP_PORT') ?? '587', 10);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      throw new Error(
        'SMTP is not configured: set SMTP_HOST, SMTP_USER and SMTP_PASS in your environment.',
      );
    }

    this.from = this.config.get<string>('SMTP_FROM') || `TrustLink <${user}>`;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.transporter
      .verify()
      .then(() => this.logger.log(`SMTP ready (${host}:${port})`))
      .catch((err) =>
        this.logger.error(`SMTP verify failed: ${(err as Error).message}`),
      );
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
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${to}: ${(err as Error).message}`,
      );
    }
  }
}
