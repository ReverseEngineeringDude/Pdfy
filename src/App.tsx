import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, BarChart2, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [lowAttendance, setLowAttendance] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [rollInput, setRollInput] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setData(null);

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      setData(response.data);
      setStudents(response.data.students);
      fetchLowAttendance();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else if (error.response?.data?.error) {
          setError(error.response.data.error);
        } else if (!error.response) {
          setError('Network error. Please check if the server is running.');
        } else {
          setError('Failed to analyze the PDF file. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLowAttendance = async () => {
    try {
      const response = await axios.get('http://localhost:5000/low-attendance');
      setLowAttendance(response.data);
    } catch {
      console.error("Couldn't fetch low attendance students.");
    }
  };

  const fetchStudentByRoll = async () => {
    if (!rollInput.trim()) return;
    try {
      const response = await axios.get(`http://localhost:5000/student/${rollInput.trim()}`);
      setSelectedStudent(response.data);
    } catch {
      setSelectedStudent(null);
      alert('Student not found');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Data Analysis Dashboard</h1>
          <p className="text-gray-600 text-lg">Upload your attendance PDF and get instant insights</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-center">
            <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${error ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className={`w-12 h-12 mb-4 ${error ? 'text-red-400' : 'text-gray-400'}`} />
                <p className={`mb-2 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}>
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className={`text-xs ${error ? 'text-red-500' : 'text-gray-500'}`}>PDF files only</p>
              </div>
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
            </label>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-center gap-2 text-red-500 text-center mt-4 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-gray-600">Analyzing data...</span>
          </motion.div>
        )}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <FileSpreadsheet className="w-6 h-6 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold">Overview</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-800">{data.totalStudents}</p>
                </div>
                <div>
                  <p className="text-gray-600">Average Attendance</p>
                  <p className="text-3xl font-bold text-gray-800">{data.averageAttendance}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <BarChart2 className="w-6 h-6 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold">Monthly Trends</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="attendance" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className="mt-10">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Find Student by Roll No</h3>
              <div className="flex gap-3">
                <input type="number" placeholder="Enter Roll Number" value={rollInput} onChange={(e) => setRollInput(e.target.value)} className="border px-3 py-2 rounded w-48" />
                <button onClick={fetchStudentByRoll} className="bg-blue-500 text-white px-4 py-2 rounded">Search</button>
              </div>
              {selectedStudent && (
                <div className="mt-4 text-sm">
                  <p><strong>Name:</strong> {selectedStudent.name}</p>
                  <p><strong>Roll No:</strong> {selectedStudent.rollNo}</p>
                  <p><strong>Attendance %:</strong> {selectedStudent.attendancePercent}%</p>
                  <p><strong>April Attendance:</strong> {selectedStudent.april} days ({selectedStudent.aprilPercent}%)</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Students with Attendance &lt; 75%</h3>
              <div className="overflow-auto max-h-72">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="px-4 py-2">Roll No</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowAttendance.map((student) => (
                      <tr key={student.rollNo} className="border-b">
                        <td className="px-4 py-2">{student.rollNo}</td>
                        <td className="px-4 py-2">{student.name}</td>
                        <td className="px-4 py-2">{student.attendancePercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
