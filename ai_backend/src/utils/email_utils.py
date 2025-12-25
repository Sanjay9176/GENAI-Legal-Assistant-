import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
from dotenv import load_dotenv  # ✅ NEW: Import this

# Initialize logger
logger = logging.getLogger(__name__)

# ✅ NEW: Force load the .env file
load_dotenv()

# CONFIGURATION
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("MAIL_USERNAME")
SENDER_PASSWORD = os.getenv("MAIL_PASSWORD")

def send_otp_email(recipient_email: str, otp: str):
    """
    Sends a 6-digit OTP to the user's email using the credentials in .env
    """
    # Debug print to see if it's working (Remove this later)
    print(f"📧 Debug: Loading credentials for {SENDER_EMAIL}")

    if not SENDER_EMAIL or not SENDER_PASSWORD:
        logger.error("❌ Email credentials missing in .env file. Cannot send OTP.")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = "Reset Password - Gen-Vidhik Sahayak"

        body = f"""
        Hello,

        You requested to reset your password.
        
        Your Verification Code is: {otp}

        This code expires in 10 minutes.
        If you did not request this, please ignore this email.

        Regards,
        Gen-Vidhik Team
        """
        
        msg.attach(MIMEText(body, 'plain'))

        # Connect to Gmail Server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls() # Secure the connection
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, recipient_email, text)
        server.quit()
        
        logger.info(f"✅ Email successfully sent to {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Email failed to send: {e}")
        return False