from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO

def generate_welcome_kit(hospital_name):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Page 1
    c.setFont("Helvetica-Bold", 22)
    c.drawString(50, height - 80, "Welcome to VitaPulse")

    c.setFont("Helvetica", 14)
    c.drawString(50, height - 120, f"Hospital: {hospital_name}")

    c.setFont("Helvetica", 12)
    c.drawString(50, height - 170, "VitaPulse enables longitudinal cardiovascular")
    c.drawString(50, height - 190, "risk tracking to support clinical decisions.")
    c.drawString(50, height - 220, "⚠ Not a diagnostic tool.")

    c.showPage()

    # Page 2
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 80, "How VitaPulse Works")

    steps = [
        "1. Add patients securely",
        "2. Record vitals & symptoms per visit",
        "3. Track risk trends over time",
        "4. Support clinical decisions"
    ]

    y = height - 130
    c.setFont("Helvetica", 12)
    for step in steps:
        c.drawString(50, y, step)
        y -= 25

    c.showPage()

    # Page 3
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 80, "Getting Started")

    c.setFont("Helvetica", 12)
    c.drawString(50, height - 120, "Login URL:")
    c.drawString(50, height - 140, "http://localhost:5500/frontend_v2/login.html")

    c.drawString(50, height - 180, "Support:")
    c.drawString(50, height - 200, "vitapulse.notifications@gmail.com")

    c.drawString(50, height - 240, "Please change your password after first login.")

    c.save()
    buffer.seek(0)

    return buffer