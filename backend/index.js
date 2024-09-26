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
  const { firstName, lastName, email, phone, instagramAccount, password, university, gender } = req.body;
  const imageUrl = req.file.path; // The URL of the uploaded image from Cloudinary

  try {
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, phone, instagram_account, password, image_url, university, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9) RETURNING id',
      [firstName, lastName, email, phone, instagramAccount, password, imageUrl, university, gender]
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
  const { title, description, min, max, date, time, userId, includeFirstName } = req.body; // Destructure includeFirstName

  console.log('Received request body:', req.body);

  // Check if min and max are valid integers
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    return res.status(400).json({ message: 'Min and Max must be integers.' });
  }

  try {
    // Check if the user is verified
    const userResult = await pool.query('SELECT first_name, verified FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0 || !userResult.rows[0].verified) {
      return res.status(403).json({ message: 'Your account is not verified.' });
    }

    // If the switch is on, get the first name; otherwise, set it to null
    const firstName = includeFirstName ? userResult.rows[0].first_name : null; 

    // Proceed to insert the ad
    const result = await pool.query(
      'INSERT INTO ads (title, description, user_id, min, max, date, time, info, available) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [title, description, userId, min, max, date, time, firstName, max] // Insert firstName (or null) into the query
    );

    const adId = result.rows[0].id;
    res.status(201).json({ adId, message: 'Ad created successfully' });
  } catch (error) {
    console.error('Error creating ad: ', error);
    res.status(500).json({ message: 'Error creating ad' });
  }
});


// Get all ads
app.get('/ads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ads');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ message: 'Error fetching ads' });
  }
});

// Get ad by ID
// Get ad by ID with requests
app.get('/ads/:id/requests', async (req, res) => {
  const { id } = req.params; // Get ad ID from request parameters
  try {
    const result = await pool.query(`
      SELECT u.first_name, u.last_name, u.instagram_account, u.gender, r.answer
      FROM requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.ad_id = $1
    `, [id]);

    res.status(200).json(result.rows); // Respond with user data for the requests
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
});


// Accept a request
app.post('/requests/:id/accept', async (req, res) => {
  const { id } = req.params; // Get request ID from URL parameters
  try {
    // Start a transaction
    await pool.query('BEGIN');
    
    // Update the requests table to set the answer to 1 (accepted)
    const updateRequestResult = await pool.query(
      'UPDATE requests SET answer = 1 WHERE id = $1 RETURNING ad_id',
      [id]
    );

    const adId = updateRequestResult.rows[0].ad_id; // Get the ad_id for the updated request

    // Decrease the available count in the ads table
    await pool.query('UPDATE ads SET available = available - 1 WHERE id = $1', [adId]);

    // Commit the transaction
    await pool.query('COMMIT');

    res.status(200).json({ message: 'Request accepted successfully' });
  } catch (error) {
    await pool.query('ROLLBACK'); // Rollback the transaction in case of an error
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Error accepting request' });
  }
});

// Reject a request
app.post('/requests/:id/reject', async (req, res) => {
  const { id } = req.params; // Get request ID from URL parameters
  try {
    // Update the requests table to set the answer to 0 (rejected)
    await pool.query('UPDATE requests SET answer = 0 WHERE id = $1', [id]);
    res.status(200).json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Error rejecting request' });
  }
});



// Get user profile by ID
app.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
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
app.post('/requests', async (req, res) => {
  const { ad_id, user_id } = req.body; // Get ad_id and user_id from request body

  try {
    // Insert into requests table
    const result = await pool.query(
      'INSERT INTO requests (ad_id, user_id) VALUES ($1, $2)',
      [ad_id, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Failed to create request' });
    }

    // Update available count for the ad
    await pool.query(
      'UPDATE ads SET available = available - 1 WHERE id = $1 AND available > 0',
      [ad_id]
    );

    res.status(201).json({ message: 'Request created successfully' });
  } catch (error) {
    console.error('Error creating request: ', error);
    res.status(500).json({ message: 'Error creating request' });
  }
});
// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
