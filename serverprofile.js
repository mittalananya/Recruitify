const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer'); // for resume upload
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setup MySQL connection
    const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Storage config for resumes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// API to save profile
app.post('/profile', upload.single('resume'), (req, res) => {
    const { roll_number, full_name, email, phone, dob, year_of_study,
        address, college, branch, cgpa, linkedin, github } = req.body;

    const resumePath = req.file ? req.file.path : null;

    const sql = `INSERT INTO student_profiles 
        (roll_number, full_name, email, phone, dob, year_of_study, address, college, branch, cgpa, linkedin, github, resume_path) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [roll_number, full_name, email, phone, dob, year_of_study,
        address, college, branch, cgpa, linkedin, github, resumePath],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error saving profile");
            }
            res.send("Profile created successfully!");
        });
});

// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
