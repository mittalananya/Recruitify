const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();

const app = express();

// CORS
app.use(cors({
  origin: "https://mittalananya.github.io",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: '🚀 Placement Portal Backend is Running!' });
});

// ===================================
//       STUDENT ROUTES
// ===================================

// ⭐ Student Signup
app.post('/api/student/signup', async (req, res) => {
  const { roll_number, full_name, email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO students (roll_number, full_name, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, roll_number, full_name, email
    `;
    
    pool.query(query, [roll_number, full_name, email, hashedPassword], (err, result) => {
      if (err) {
        console.log(err);
        if (err.code === '23505') {
          return res.status(400).json({ error: 'Roll number or email already exists' });
        }
        return res.status(500).json({ error: 'Signup failed' });
      }
      
      const student = result.rows[0];
      res.status(201).json({
        message: 'Student registered successfully',
        student: {
          id: student.id,
          roll_number: student.roll_number,
          full_name: student.full_name,
          email: student.email
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ⭐ Student Login
app.post('/api/student/login', (req, res) => {
  const { roll_number, password } = req.body;
  
  const query = 'SELECT * FROM students WHERE roll_number = $1';
  
  pool.query(query, [roll_number], async (err, result) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid roll number or password' });
    
    const student = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, student.password);
    
    if (!isPasswordValid)
      return res.status(401).json({ error: 'Invalid roll number or password' });
    
    const token = jwt.sign(
      { id: student.id, roll_number: student.roll_number, type: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      student: {
        id: student.id,
        roll_number: student.roll_number,
        full_name: student.full_name,
        email: student.email,
        phone: student.phone,
        dob: student.dob,
        address: student.address,
        college: student.college,
        branch: student.branch,
        cgpa: student.cgpa,
        year_of_study: student.year_of_study,
        profile_completed: student.profile_completed
      }
    });
  });
});

// ⭐ Update Student Profile
app.put('/api/student/profile/:roll_number', async (req, res) => {
  const { roll_number } = req.params;
  const { 
    phone, dob, address, college, branch, cgpa, 
    year_of_study, tagline, linkedin, github, sgpa 
  } = req.body;
  
  try {
    const query = `
      UPDATE students 
      SET phone = $1, dob = $2, address = $3, college = $4, 
          branch = $5, cgpa = $6, year_of_study = $7, 
          tagline = $8, linkedin = $9, github = $10, 
          sgpa = $11, profile_completed = true
      WHERE roll_number = $12
      RETURNING *
    `;
    
    const sgpaJson = sgpa ? JSON.stringify(sgpa) : null;
    
    pool.query(query, [
      phone, dob, address, college, branch, cgpa, 
      year_of_study, tagline, linkedin, github, sgpaJson, roll_number
    ], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Profile update failed' });
      }
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      const student = result.rows[0];
      delete student.password; // Don't send password
      
      res.json({
        message: 'Profile updated successfully',
        student
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ⭐ Get Student Dashboard Data
app.get('/api/student/dashboard/:roll_number', async (req, res) => {
  const { roll_number } = req.params;
  
  try {
    const query = 'SELECT * FROM students WHERE roll_number = $1';
    
    pool.query(query, [roll_number], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      const student = result.rows[0];
      delete student.password;
      
      res.json({
        student,
        skillsCount: 0,  // TODO: Count from skills table when implemented
        projectsCount: 0  // TODO: Count from projects when implemented
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
// ===================================
//       RECRUITER ROUTES
// ===================================

// ⭐ Recruiter Signup
app.post('/api/recruiter/signup', async (req, res) => {
  const { companyName, gstNumber, email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO recruiters (company_name, gst_number, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, company_name, gst_number, email, created_at
    `;
    
    pool.query(query, [companyName, gstNumber, email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Signup error:', err);
        if (err.code === '23505') {
          return res.status(400).json({ 
            success: false,
            message: 'GST number or email already exists' 
          });
        }
        return res.status(500).json({ 
          success: false,
          message: 'Signup failed' 
        });
      }
      
      const recruiter = result.rows[0];
      const token = jwt.sign(
        { id: recruiter.id, email: recruiter.email, type: 'recruiter' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.status(201).json({
        success: true,
        message: 'Recruiter registered successfully',
        token,
        recruiter: {
          id: recruiter.id,
          company_name: recruiter.company_name,
          gst_number: recruiter.gst_number,
          email: recruiter.email,
          created_at: recruiter.created_at
        }
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ⭐ Recruiter Login
app.post('/api/recruiter/login', (req, res) => {
  const { email, password } = req.body;
  
  const query = 'SELECT * FROM recruiters WHERE email = $1';
  
  pool.query(query, [email], async (err, result) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Login failed' 
      });
    }
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    const recruiter = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, recruiter.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    const token = jwt.sign(
      { id: recruiter.id, email: recruiter.email, type: 'recruiter' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      recruiter: {
        id: recruiter.id,
        company_name: recruiter.company_name,
        gst_number: recruiter.gst_number,
        email: recruiter.email,
        created_at: recruiter.created_at
      }
    });
  });
});

// ⭐ Get Recruiter Dashboard Data
app.get('/api/recruiter/dashboard/:email', async (req, res) => {
  const { email } = req.params;
  
  try {
    const query = 'SELECT * FROM recruiters WHERE email = $1';
    
    pool.query(query, [email], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to fetch profile' 
        });
      }
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Recruiter not found' 
        });
      }
      
      const recruiter = result.rows[0];
      delete recruiter.password; // Don't send password
      
      res.json({
        success: true,
        recruiter
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
