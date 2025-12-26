from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import black, blue, gray
from reportlab.lib.units import inch
from io import BytesIO

class GenerateResumeView(APIView):
    def post(self, request):
        data = request.data
        buffer = BytesIO()

        # Document setup
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)
        
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='SectionHeader', fontSize=12, leading=16, spaceAfter=6, textColor=blue, fontName='Helvetica-Bold'))
        styles.add(ParagraphStyle(name='JobTitle', fontSize=10, leading=12, fontName='Helvetica-Bold'))
        styles.add(ParagraphStyle(name='NormalSmall', parent=styles['Normal'], fontSize=9, leading=12))

        story = []

        # -- Header --
        name = data.get('fullName', 'Your Name')
        email = data.get('email', 'email@example.com')
        phone = data.get('phone', '123-456-7890')
        linkedin = data.get('linkedin', '')

        story.append(Paragraph(name, styles['Title']))
        story.append(Paragraph(f"{email} | {phone} | {linkedin}", styles['Normal']))
        story.append(Spacer(1, 12))
        story.append(HRFlowable(width="100%", thickness=1, color=black))
        story.append(Spacer(1, 12))

        # -- Professional Summary --
        summary = data.get('summary', '')
        if summary:
            story.append(Paragraph("Professional Summary", styles['SectionHeader']))
            story.append(Paragraph(summary, styles['Normal']))
            story.append(Spacer(1, 12))

        # -- Experience --
        experiences = data.get('experience', []) # List of dicts {title, company, duration, description}
        if experiences:
            story.append(Paragraph("Experience", styles['SectionHeader']))
            for exp in experiences:
                title = f"{exp.get('title', 'Role')} at {exp.get('company', 'Company')}"
                story.append(Paragraph(title, styles['JobTitle']))
                story.append(Paragraph(exp.get('duration', ''), styles['NormalSmall']))
                story.append(Paragraph(exp.get('description', ''), styles['Normal']))
                story.append(Spacer(1, 6))
            story.append(Spacer(1, 6))

        # -- Education --
        education = data.get('education', []) # List of dicts {degree, school, year}
        if education:
            story.append(Paragraph("Education", styles['SectionHeader']))
            for edu in education:
                text = f"{edu.get('degree', 'Degree')} - {edu.get('school', 'School')} ({edu.get('year', '')})"
                story.append(Paragraph(text, styles['Normal']))
            story.append(Spacer(1, 12))

        # -- Skills --
        skills = data.get('skills', '') # comma separated
        if skills:
            story.append(Paragraph("Skills", styles['SectionHeader']))
            story.append(Paragraph(skills, styles['Normal']))

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{name.replace(" ", "_")}_Resume.pdf"'
        return response
