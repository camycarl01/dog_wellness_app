"""
Gmail SMTP email sending wrapper (replaces SendGrid).

Setup required:
1. Use a real Gmail account (create a dedicated one for this app rather
   than your personal account, e.g. pawcarereminders@gmail.com).
2. Enable 2-Step Verification on that Google account (Google Account ->
   Security -> 2-Step Verification). This is REQUIRED -- Gmail no longer
   allows plain password SMTP login for most accounts.
3. Generate an "App Password": Google Account -> Security -> 2-Step
   Verification -> App Passwords -> create one for "Mail". Google gives
   you a 16-character password -- this is what GMAIL_APP_PASSWORD below
   should be set to, NOT your normal Gmail login password.
4. Set environment variables:
     GMAIL_ADDRESS=youraccount@gmail.com
     GMAIL_APP_PASSWORD=the16charapppassword

Known limits: Gmail caps regular accounts at roughly 500 emails/day, and
may flag/rate-limit accounts that suddenly send many automated emails.
Fine for a student project's daily reminder volume, but not meant for
production-scale sending.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587  # STARTTLS port


def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """
    Sends a single email via Gmail SMTP.

    Returns {"success": bool, "status_code": None, "error": str | None}.
    status_code is always None here since SMTP doesn't have HTTP-style
    status codes -- kept in the return shape for compatibility with code
    that expects this same dict shape (e.g. reminders.py's router logic).
    """
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        return {
            "success": False,
            "status_code": None,
            "error": "GMAIL_ADDRESS or GMAIL_APP_PASSWORD not configured in environment",
        }

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = GMAIL_ADDRESS
    message["To"] = to_email
    message.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, to_email, message.as_string())
        return {"success": True, "status_code": None, "error": None}
    except smtplib.SMTPAuthenticationError as e:
        return {
            "success": False,
            "status_code": None,
            "error": f"Gmail authentication failed -- check GMAIL_ADDRESS/GMAIL_APP_PASSWORD "
                     f"and that you're using an App Password, not your regular Gmail password: {e}",
        }
    except Exception as e:
        return {"success": False, "status_code": None, "error": str(e)}