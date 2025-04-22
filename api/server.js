import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse';

const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

app.use(cors());
app.use(express.json());

const analyzePdf = async (buffer) => {
  try {
    const data = await pdf(buffer);
    
    // Mock analysis - In a real application, you would implement proper parsing logic
    // based on your PDF structure
    return {
      totalStudents: 150,
      averageAttendance: 85,
      monthlyData: [
        { month: "January", attendance: 88 },
        { month: "February", attendance: 82 },
        { month: "March", attendance: 85 },
        { month: "April", attendance: 90 }
      ]
    };
  } catch (error) {
    console.error('PDF analysis error:', error);
    throw new Error('Failed to analyze PDF. Please ensure the file is not corrupted.');
  }
};

app.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const result = await analyzePdf(req.file.buffer);
    res.json(result);
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: 'File upload error. Please try again.' });
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});