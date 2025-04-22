from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import re
from statistics import mean

app = Flask(__name__)
CORS(app)

def analyze_pdf(pdf_file):
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text_content = ""
    for page in pdf_reader.pages:
        text_content += page.extract_text()

    pattern = re.compile(
        r'(\d+)\.\s+(\d+)\s+([A-Z.\s]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+\.\d)',
        re.MULTILINE
    )
    matches = pattern.findall(text_content)

    if not matches:
        raise ValueError("Could not extract attendance data from the PDF.")

    working_days_april = 8
    students = []
    attendance_percentages = []
    april_percentages = []

    for match in matches:
        roll_no, adm_no, name, dec_mar, april, total, percent = match
        percent = float(percent)
        april = int(april)
        april_percent = (april / working_days_april) * 100

        students.append({
            "rollNo": int(roll_no),
            "admissionNo": adm_no,
            "name": name.strip(),
            "decToMar": int(dec_mar),
            "april": april,
            "total": int(total),
            "attendancePercent": percent,
            "aprilPercent": round(april_percent, 1)
        })

        attendance_percentages.append(percent)
        april_percentages.append(april_percent)

    return {
        "totalStudents": len(students),
        "averageAttendance": round(mean(attendance_percentages), 1),
        "monthlyData": [
            {
                "month": "April",
                "attendance": round(mean(april_percentages), 1)
            }
        ],
        "students": students
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith('.pdf'):
        return jsonify({"error": "Only PDF files are allowed"}), 400
    try:
        result = analyze_pdf(file)
        app.cached_data = result  # Cache data
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] {str(e)}")  # Debugging line
        return jsonify({"error": str(e)}), 500


@app.route('/student/<int:roll_no>', methods=['GET'])
def get_student(roll_no):
    if not hasattr(app, 'cached_data'):
        return jsonify({"error": "Data not available. Please upload a PDF first."}), 400
    
    student = next((s for s in app.cached_data["students"] if s["rollNo"] == roll_no), None)
    if student:
        return jsonify(student)
    else:
        return jsonify({"error": "Student not found"}), 404

@app.route('/low-attendance', methods=['GET'])
def get_low_attendance_students():
    if not hasattr(app, 'cached_data'):
        return jsonify({"error": "Data not available. Please upload a PDF first."}), 400

    low_attendance = [s for s in app.cached_data["students"] if s["attendancePercent"] < 75]
    return jsonify(low_attendance)


if __name__ == '__main__':
    app.run(debug=True)