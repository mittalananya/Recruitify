const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ message: '🚀 Placement Portal Backend is Running!' });
});

// ========== STUDENT ROUTES ==========

// Student Signup
app.post('/api/student/signup', async (req, res) => {
    const { roll_number, full_name, email, password } = req.body;

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO students (roll_number, full_name, email, password) VALUES (?, ?, ?, ?)';
        
        db.query(query, [roll_number, full_name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Roll number or email already exists' });
                }
                return res.status(500).json({ error: 'Signup failed' });
            }
            res.status(201).json({ message: 'Student registered successfully', studentId: result.insertId });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Student Login
app.post('/api/student/login', (req, res) => {
    const { roll_number, password } = req.body;

    const query = 'SELECT * FROM students WHERE roll_number = ?';
    
    db.query(query, [roll_number], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Login failed' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid roll number or password' });
        }

        const student = results[0];
        const isPasswordValid = await bcrypt.compare(password, student.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid roll number or password' });
        }

        // Create token
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
                email: student.email
            }
        });
    });
});

// Get Student Profile
app.get('/api/student/profile/:id', (req, res) => {
    const query = 'SELECT * FROM students WHERE id = ?';
    
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        // Don't send password to frontend
        const student = results[0];
        delete student.password;
        res.json(student);
    });
});

// Complete Student Profile (after signup)
app.put('/api/student/profile/complete/:id', (req, res) => {
    const {
        phone,
        dob,
        address,
        college,
        branch,
        year_of_study,
        cgpa,
        sgpa_data,
        tagline,
        linkedin_url,
        github_url
    } = req.body;
    
    const query = `UPDATE students SET 
        phone = ?, 
        dob = ?, 
        address = ?, 
        college = ?, 
        branch = ?, 
        year_of_study = ?, 
        cgpa = ?, 
        sgpa_data = ?, 
        tagline = ?, 
        linkedin_url = ?, 
        github_url = ?,
        profile_completed = TRUE
        WHERE id = ?`;
    
    const sgpaJson = JSON.stringify(sgpa_data || []);
    
    db.query(query, [
        phone, dob, address, college, branch, year_of_study, 
        cgpa, sgpaJson, tagline, linkedin_url, github_url, req.params.id
    ], (err, result) => {
        if (err) {
            console.error('Profile update error:', err);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
        res.json({ message: 'Profile completed successfully' });
    });
});

// ========== RECRUITER ROUTES ==========

// Recruiter Signup
app.post('/api/recruiter/signup', async (req, res) => {
    const { company_name, email, password, contact_person, phone } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO recruiters (company_name, email, password, contact_person, phone) VALUES (?, ?, ?, ?, ?)';
        
        db.query(query, [company_name, email, hashedPassword, contact_person, phone], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: 'Signup failed' });
            }
            res.status(201).json({ message: 'Recruiter registered successfully', recruiterId: result.insertId });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Recruiter Login
app.post('/api/recruiter/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM recruiters WHERE email = ?';
    
    db.query(query, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Login failed' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const recruiter = results[0];
        const isPasswordValid = await bcrypt.compare(password, recruiter.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: recruiter.id, email: recruiter.email, type: 'recruiter' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            recruiter: {
                id: recruiter.id,
                company_name: recruiter.company_name,
                email: recruiter.email
            }
        });
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});