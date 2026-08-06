import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings


def send_password_reset_email(email: str, token_url: str) -> None:
    """Send a real password-reset email via SMTP (Gmail by default)."""

    print(f"[EMAIL] Attempting to send reset email to: {email}")
    print(f"[EMAIL] Using SMTP user: {settings.MAIL_USERNAME}")

    # ── Guard: skip real send if credentials are not configured ──────────────
    if not settings.MAIL_USERNAME or settings.MAIL_USERNAME == "your_gmail@gmail.com":
        print(
            f"[EMAIL WARNING] Email credentials not configured in .env — "
            f"reset link (not sent): {token_url}"
        )
        return

    # ── Build the HTML message ────────────────────────────────────────────────
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Lexora — Password Reset Instructions"
    msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    msg["To"] = email

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background:#f4f4f7; padding:40px;">
        <div style="max-width:520px;margin:auto;background:#fff;border-radius:8px;
                    padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <h2 style="color:#1a1a2e;margin-bottom:8px;">Lexora Legal Systems</h2>
          <p style="color:#555;font-size:15px;">
            We received a request to reset your password.
            Click the button below to choose a new one.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="{token_url}"
               style="background:#2d5be3;color:#fff;padding:14px 32px;
                      border-radius:6px;text-decoration:none;font-size:15px;
                      font-weight:600;display:inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color:#888;font-size:13px;">
            This link expires in <strong>15 minutes</strong>.<br>
            If you did not request a password reset, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
          <p style="color:#aaa;font-size:12px;text-align:center;">
            © 2026 Lexora Legal Systems. All Rights Reserved.
          </p>
        </div>
      </body>
    </html>
    """

    msg.attach(MIMEText(html_body, "html"))

    # ── Send via SMTP (TLS / SSL fallback) ───────────────────────────────────
    sent = False
    try:
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM or settings.MAIL_USERNAME, email, msg.as_string())
        print(f"[EMAIL SUCCESS] Password-reset email sent to {email} via STARTTLS")
        sent = True
    except smtplib.SMTPAuthenticationError as e:
        print(
            f"[EMAIL ERROR] SMTP authentication failed — check MAIL_USERNAME / MAIL_PASSWORD in .env. Detail: {e}"
        )
    except Exception as exc:
        print(f"[EMAIL WARNING] Primary STARTTLS send failed: {exc}. Attempting SMTP_SSL fallback on port 465...")

    if not sent:
        try:
            with smtplib.SMTP_SSL(settings.MAIL_SERVER, 465, timeout=10) as server:
                server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
                server.sendmail(settings.MAIL_FROM or settings.MAIL_USERNAME, email, msg.as_string())
            print(f"[EMAIL SUCCESS] Password-reset email sent to {email} via SSL (port 465)")
        except Exception as ssl_exc:
            print(f"[EMAIL ERROR] Failed to send password-reset email via SSL fallback: {ssl_exc}")


