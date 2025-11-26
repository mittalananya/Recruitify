# Recruitify - Campus Placement Portal

A web-based campus placement management system connecting students and recruiters.

## Features

### For Students:
- Create profile with academic details
- Add skills (hard & soft skills) with project links
- Browse job openings
- View shortlisted status

### For Recruiters:
- Post job vacancies
- View applicants
- Shortlist candidates
- Manage company profile

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JWT, bcrypt

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/recruitify.git
cd recruitify
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
PORT=3000
JWT_SECRET=your_secret_key_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=placement_portal
```

4. Set up the database:
- Create MySQL database named `placement_portal`
- Run the SQL schema files in `/database` folder

5. Start the server:
```bash
node server.js
```

6. Open `studentlogin.html` or `recruiterlogin.html` in your browser

## Project Structure
```
recruitify/
├── server.js              # Main backend server
├── db.js                  # Database connection
├── .env                   # Environment variables (not uploaded)
├── package.json           # Dependencies
├── studentlogin.html      # Student authentication
├── studentdashboard.html  # Student dashboard
├── recruiterlogin.html    # Recruiter authentication
├── recruiterprofile.html  # Recruiter profile setup
├── recruiterdashboard.html # Recruiter dashboard
└── README.md              # This file
```

## Database Schema

Tables:
- `students` - Student information
- `skills` - Student skills portfolio
- `recruiters` - Recruiter accounts
- `recruiter_profiles` - Recruiter company details
- `jobs` - Job postings

## Contributors

- Your Name - [GitHub Profile](https://github.com/YOUR_USERNAME)

## License

This project is open source and available under the MIT License.