from email.message import EmailMessage
import smtplib

SMTP_HOST = "smtp-relay.brevo.com"
SMTP_PORT = 587

SMTP_LOGIN = "a0c629001@smtp-brevo.com"
SMTP_PASSWORD = "q2N6JIDncS1pVWv3"

SENDER_EMAIL = "vitapulse.notifications@gmail.com"  # must be a VERIFIED sender in Brevo


def send_email_with_pdf(to_emails, subject, body, pdf_buffer):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = ", ".join(to_emails)

    msg.set_content(body)

    msg.add_attachment(
        pdf_buffer.getvalue(),
        maintype="application",
        subtype="pdf",
        filename="patient_report.pdf"
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_LOGIN, SMTP_PASSWORD)
        server.send_message(msg)

def send_hospital_credentials(email, password):
    subject = "VitaPulse Access Approved"

    body = f"""
Hello,

Your hospital access to VitaPulse has been approved.

Login URL:
http://localhost:5500/frontend_v2/login.html

Login Email:
{email}

Temporary Password:
{password}

Please change your password after first login.

— VitaPulse Team
"""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = email

    msg.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_LOGIN, SMTP_PASSWORD)
        server.send_message(msg)


def send_admin_new_request_email(request_data):
    subject = "New Hospital Access Request — VitaPulse"

    body = f"""
New hospital access request received.

Hospital Name:
{request_data.get("hospital_name")}

Email:
{request_data.get("email")}

License Number:
{request_data.get("license_number")}

Hospital Type:
{request_data.get("hospital_type")}

Intended Use:
{request_data.get("intended_use")}

Justification:
{request_data.get("justification")}

Action Required:
Review and approve from Admin Panel.

— VitaPulse System
"""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = SENDER_EMAIL  # admin email (same for hackathon)

    msg.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_LOGIN, SMTP_PASSWORD)
        server.send_message(msg)


def send_welcome_kit(email, hospital_name):
    from utils.welcome_kit_pdf import generate_welcome_kit

    pdf_buffer = generate_welcome_kit(hospital_name)

    subject = "Welcome to VitaPulse — Your Getting Started Kit"

    body = f"""
Hello {hospital_name} Team,

Welcome to VitaPulse 👋

Your hospital access has been successfully approved.

Please find attached your Welcome Kit, which includes:
• How VitaPulse works
• Clinical workflow overview
• Sample patient journey
• Support & contact information

Login URL:
http://localhost:5500/frontend_v2/login.html

If you need help, contact:
vitapulse.notifications@gmail.com

— VitaPulse Team
"""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = email
    msg.set_content(body)

    msg.add_attachment(
        pdf_buffer.getvalue(),
        maintype="application",
        subtype="pdf",
        filename="VitaPulse_Welcome_Kit.pdf"
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_LOGIN, SMTP_PASSWORD)
        server.send_message(msg)

def send_rejection_email(email, hospital_name):
    subject = "VitaPulse Access Request Update"

    body = f"""
Hello {hospital_name},

Thank you for your interest in VitaPulse.

After reviewing your hospital access request, we regret to inform you that we are unable to approve it at this time.

This decision may be due to eligibility criteria, incomplete information, or current capacity limitations.

You are welcome to apply again in the future or reach out to us for clarification.

— VitaPulse Team
"""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = email

    msg.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_LOGIN, SMTP_PASSWORD)
        server.send_message(msg)