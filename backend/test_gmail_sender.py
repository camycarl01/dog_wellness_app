"""
Standalone test script -- run this directly to confirm your Gmail App
Password setup actually works, BEFORE wiring email sending into the full
FastAPI app. This isolates "is my Gmail config right?" from "is my app
logic right?" so if something fails, you know exactly which layer to debug.

Usage:
    1. Fill in the three values below (or set them as real environment
       variables and delete the hardcoded lines).
    2. Run: python test_gmail_send.py
    3. Check the recipient inbox (and spam folder) for the test email.
"""
import os

# --- Fill these in directly for a quick one-off test, OR set them as
# real environment variables and remove these three lines. ---
os.environ["GMAIL_ADDRESS"] = "camycarl17@gmail.com"       # <-- your Gmail address
os.environ["GMAIL_APP_PASSWORD"] = "nelabzlnzxxquhrn"         # <-- the 16-char App Password (no spaces)
TEST_RECIPIENT = "camycarl01@gmail.com"                       # <-- where to send the test email (can be the same address)

from email_sender import send_email

print(f"Attempting to send a test email to {TEST_RECIPIENT}...")

result = send_email(
    to_email=TEST_RECIPIENT,
    subject="PawCare test email",
    html_content="<p>This is a test email from your PawCare reminder system. If you're reading this, Gmail SMTP is working correctly!</p>",
)

print()
print("Result:", result)
print()

if result["success"]:
    print("✅ Success! Check the recipient's inbox (and spam folder) to confirm it actually arrived.")
else:
    print("❌ Failed. See the error above.")
    print()
    print("Common causes:")
    print("  - GMAIL_APP_PASSWORD is your regular Gmail password, not an App Password")
    print("  - 2-Step Verification isn't enabled on the Gmail account")
    print("  - There are spaces in the App Password (remove them -- Google displays it in")
    print("    groups of 4 for readability, but the actual password has no spaces)")
    print("  - GMAIL_ADDRESS has a typo")