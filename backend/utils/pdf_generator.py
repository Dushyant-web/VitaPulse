from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime


# ===============================
# 🎯 RISK COLOR HELPER (STEP 7)
# ===============================
def risk_color(risk_level):
    if risk_level == "High":
        return colors.red
    if risk_level == "Medium":
        return colors.orange
    if risk_level == "Low":
        return colors.green
    return colors.black


# ===============================
# 🔢 PAGE NUMBER FOOTER (STEP 7)
# ===============================
def add_page_numbers(canvas, doc):
    page_num = canvas.getPageNumber()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.grey)
    canvas.drawRightString(550, 20, f"Page {page_num}")


def generate_patient_report(hospital, patient, records):
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="HospitalTitle",
        fontSize=18,
        spaceAfter=6,
        alignment=1,
        fontName="Helvetica-Bold"
    ))

    styles.add(ParagraphStyle(
        name="HospitalSub",
        fontSize=10,
        alignment=1,
        textColor=colors.grey
    ))

    styles.add(ParagraphStyle(
        name="SectionTitle",
        fontSize=13,
        spaceBefore=12,
        spaceAfter=6,
        fontName="Helvetica-Bold"
    ))

    styles.add(ParagraphStyle(
        name="VisitTitle",
        fontSize=14,
        spaceBefore=14,
        spaceAfter=8,
        fontName="Helvetica-Bold",
        textColor=colors.darkblue
    ))

    story = []

    # ===============================
    # 🏥 HOSPITAL HEADER
    # ===============================
    story.append(Paragraph(
        hospital.get("name", "Hospital Name"),
        styles["HospitalTitle"]
    ))

    story.append(Paragraph(
        hospital.get("address", "Hospital Address"),
        styles["HospitalSub"]
    ))

    story.append(Spacer(1, 10))
    story.append(Table([[""]], colWidths=[480],
        style=[("LINEBELOW", (0, 0), (-1, -1), 1, colors.black)]
    ))
    story.append(Spacer(1, 14))

    # ===============================
    # 📄 REPORT TITLE
    # ===============================
    story.append(Paragraph(
        "PATIENT MEDICAL REPORT",
        ParagraphStyle(
            "ReportTitle",
            fontSize=16,
            alignment=1,
            fontName="Helvetica-Bold"
        )
    ))

    story.append(Spacer(1, 16))

    # ===============================
    # 👤 PATIENT DETAILS
    # ===============================
    patient_table = Table(
        [
            ["Patient Name", patient.get("name", "—")],
            ["Patient ID", patient.get("patient_id", "—")],
            ["Age", patient.get("age", "—")],
            ["Gender", patient.get("gender", "—")],
            ["Patient Email", patient.get("patient_email", "—")],
            ["Guardian Email", patient.get("guardian_email", "—")],
        ],
        colWidths=[160, 320]
    )

    patient_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    story.append(patient_table)
    story.append(Spacer(1, 20))

    # ===============================
    # 📊 SUMMARY PAGE (STEP 7)
    # ===============================
    story.append(Paragraph(
        "Clinical Summary",
        ParagraphStyle(
            "SummaryTitle",
            fontSize=15,
            fontName="Helvetica-Bold",
            spaceAfter=12
        )
    ))

    if records:
        latest = records[-1]
        pred = latest.get("prediction", {})
        risk_level = pred.get("risk_level", "—")

        story.append(Paragraph(
            f"<b>Latest Risk Level:</b> "
            f"<font color='{risk_color(risk_level).hexval()}'>"
            f"{risk_level}</font>",
            styles["Normal"]
        ))

        story.append(Paragraph(
            f"<b>Probability:</b> {round(pred.get('probability', 0)*100)}%",
            styles["Normal"]
        ))

        story.append(Spacer(1, 8))

        trend = patient.get("trend", "Stable")
        story.append(Paragraph(
            f"<b>Overall Trend:</b> {trend}",
            styles["Normal"]
        ))

    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "The following pages contain a detailed visit-wise medical timeline.",
        styles["Normal"]
    ))

    story.append(PageBreak())

    # ===============================
    # 🧾 VISITS
    # ===============================
    for i, r in enumerate(records, start=1):
        created_at = r.get("created_at")
        date_str = "—"
        if created_at and hasattr(created_at, "seconds"):
            date_str = datetime.fromtimestamp(created_at.seconds).strftime(
                "%d %B %Y at %I:%M %p"
            )

        story.append(Paragraph(
            f"Visit {i} ({date_str})",
            styles["VisitTitle"]
        ))

        pred = r.get("prediction", {})
        risk = pred.get("risk_level")

        story.append(Paragraph(
            f"<b>Risk:</b> "
            f"<font color='{risk_color(risk).hexval()}'>"
            f"{risk}</font> "
            f"({round(pred.get('probability', 0)*100)}%)",
            styles["Normal"]
        ))

        inp = r.get("input", {})
        derived = r.get("derived", {})

        story.append(Spacer(1, 6))
        story.append(Paragraph("<b>Vitals</b>", styles["SectionTitle"]))
        story.append(Paragraph(
            f"BP: {inp.get('ap_hi')}/{inp.get('ap_lo')}<br/>"
            f"BMI: {derived.get('bmi')}<br/>"
            f"Weight: {inp.get('weight')}",
            styles["Normal"]
        ))

        story.append(Paragraph("<b>Lifestyle</b>", styles["SectionTitle"]))
        story.append(Paragraph(
            f"Smoking: {'Yes' if inp.get('smoke') else 'No'}<br/>"
            f"Alcohol: {'Yes' if inp.get('alco') else 'No'}<br/>"
            f"Active: {'Yes' if inp.get('active') else 'No'}",
            styles["Normal"]
        ))

        story.append(Paragraph("<b>Symptoms</b>", styles["SectionTitle"]))
        story.append(Paragraph(
            f"Chest Pain: {inp.get('chest_pain')}<br/>"
            f"Nausea: {'Yes' if inp.get('nausea') else 'No'}<br/>"
            f"Palpitations: {'Yes' if inp.get('palpitations') else 'No'}<br/>"
            f"Dizziness: {inp.get('dizziness')}",
            styles["Normal"]
        ))

        ecg = r.get("ecg")
        story.append(Paragraph("<b>ECG</b>", styles["SectionTitle"]))
        if ecg:
            story.append(Paragraph(
                f"Heart Rate: {ecg.get('heart_rate')}<br/>"
                f"PR Interval: {ecg.get('pr_interval_ms')} ms<br/>"
                f"QRS Duration: {ecg.get('qrs_duration_ms')} ms<br/>"
                f"QT Interval: {ecg.get('qt_interval_ms')} ms<br/>"
                f"Arrhythmia: {'Detected' if ecg.get('arrhythmia_detected') else 'No'}",
                styles["Normal"]
            ))
        else:
            story.append(Paragraph("ECG not recorded.", styles["Normal"]))

        ecg_flags = r.get("ecg_flags")
        story.append(Paragraph("<b>ECG Assessment</b>", styles["SectionTitle"]))
        if ecg_flags:
            story.append(Paragraph(
                f"Status: {ecg_flags.get('status')}",
                styles["Normal"]
            ))
            for f in ecg_flags.get("flags", []):
                story.append(Paragraph(f"• {f}", styles["Normal"]))
        else:
            story.append(Paragraph("Not recorded.", styles["Normal"]))

        delta = derived.get("ecg_risk_delta")
        if delta:
            story.append(Paragraph("<b>ECG Impact on Risk</b>", styles["SectionTitle"]))
            story.append(Paragraph(
                f"Risk Delta: {delta.get('delta')}%",
                styles["Normal"]
            ))
            for reason in delta.get("reasons", []):
                story.append(Paragraph(f"• {reason}", styles["Normal"]))

        note = r.get("doctor_note")
        story.append(Paragraph("<b>Doctor Notes</b>", styles["SectionTitle"]))
        story.append(Paragraph(
            note if note else "No doctor note recorded.",
            styles["Normal"]
        ))

        story.append(Spacer(1, 18))

    # ===============================
    # FOOTER DISCLAIMER
    # ===============================
    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "<i>This report is generated for clinical reference only and is not a medical diagnosis.</i>",
        styles["Normal"]
    ))

    doc.build(
        story,
        onFirstPage=add_page_numbers,
        onLaterPages=add_page_numbers
    )

    buffer.seek(0)
    return buffer