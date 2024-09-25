require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // Import PostgreSQL Pool
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const upload = require('./cloudinary'); // Multer configuration for cloudinary

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(express.json());
app.use(cors());
app.use(bodyParser.json()); // For parsing application/json


const pool = new Pool({
  host: process.env.SUPABASE_HOST,
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  database: process.env.SUPABASE_DATABASE,
  port: process.env.SUPABASE_PORT || 5432,
  ssl: { rejectUnauthorized: false },
});

// Sign-In Endpoint
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      // Return a JSON response with userId and a success message
      res.status(200).json({ userId: user.id, message: 'Sign-in successful' });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during sign-in: ', error);
    res.status(500).json({ message: 'Error during sign-in' });
  }
});

// Sign-Up Endpoint
app.post('/signup', upload.single('image'), async (req, res) => {
  const { firstName, lastName, email, phone, instagramAccount, instagramPassword, university } = req.body;
  const imageUrl = req.file.path; // The URL of the uploaded image from Cloudinary

  try {
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, phone, instagram_account, password, image_url, university) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [firstName, lastName, email, phone, instagramAccount, password, imageUrl, university]
    );

    const userId = result.rows[0].id;
    res.status(201).json({ userId, message: 'User created successfully' });
  } catch (error) {
    console.error('Error during sign-up: ', error);
    res.status(500).json({ message: 'Error during sign-up' });
  }
});

// Create Ad Endpoint
app.post('/ads', async (req, res) => {
  const { title, description, min, max, date, time, userId } = req.body;

  // Log the received request body for debugging
  console.log('Received request body:', req.body);

  // Check if min and max are valid integers
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    return res.status(400).json({ message: 'Min and Max must be integers.' });
  }

  // You can add additional validation checks here if needed

  try {
    // Check if the user is verified
    const userResult = await pool.query('SELECT verified FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0 || !userResult.rows[0].verified) {
      return res.status(403).json({ message: 'Your account is not verified.' });
    }

    // Proceed to insert the ad
    const result = await pool.query(
      'INSERT INTO ads (title, description, user_id, min, max, date, time) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [title, description, userId, min, max, date, time]
    );

    const adId = result.rows[0].id;
    res.status(201).json({ adId, message: 'Ad created successfully' });
  } catch (error) {
    console.error('Error creating ad: ', error);
    res.status(500).json({ message: 'Error creating ad' });
  }
});
// Add this in your server.js or wherever your routes are defined
app.get('/ads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ads');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ message: 'Error fetching ads' });
  }
});
// Get user profile by ID
app.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT first_name, last_name, email, phone, instagram_account FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile: ', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});
// Update user profile
app.put('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const { first_name, last_name, email, phone, instagram_account } = req.body;

  try {
    const result = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3, phone = $4, instagram_account = $5 WHERE id = $6',
      [first_name, last_name, email, phone, instagram_account, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile: ', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});


// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
