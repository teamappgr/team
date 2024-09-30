require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // Import PostgreSQL Pool
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const upload = require('./cloudinary'); // Multer configuration for cloudinary

const PORT = process.env.PORT || 5000;
const webpush = require('web-push'); // Add this line to import web-push

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST','DELETE'],
    credentials: true,
  },
});
// Retrieve VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('VAPID keys are missing. Please check your environment variables.');
  process.exit(1); // Exit the application if keys are not set
}

// Set VAPID details using the keys from the environment variables
webpush.setVapidDetails(
  'mailto:teamappgr24@gmail.com', // Replace with your email
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Log the VAPID keys to verify they're correctly loaded (remove this in production)
console.log('VAPID Keys from .env:', { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY });


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
  const { title, description, min, max, date, time, userId, info } = req.body; // Destructure info

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

    // Proceed to insert the ad with the received info
    const result = await pool.query(
      'INSERT INTO ads (title, description, user_id, min, max, date, time, info, available) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [title, description, userId, min, max, date, time, info, max] // Set available to true or based on your logic
    );

    const adId = result.rows[0].id;
    res.status(201).json({ adId, message: 'Ad created successfully' });
  } catch (error) {
    console.error('Error creating ad: ', error);
    res.status(500).json({ message: 'Error creating ad' });
  }
});

// Get ads by user ID
app.get('/ads1', async (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const result = await pool.query('SELECT * FROM ads WHERE user_id = $1', [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ message: 'Error fetching ads' });
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
app.get('/ads/:id/requests', async (req, res) => {
  const { id } = req.params; // Get ad ID from request parameters

  try {
    const result = await pool.query(`
      SELECT 
        r.id AS requestId,  -- Fetch the request ID from the requests table
        u.first_name, 
        u.last_name, 
        u.instagram_account, 
        u.gender, 
        r.answer
      FROM requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.ad_id = $1
    `, [id]);


    // Check if any rows were returned
    if (result.rows.length > 0) {
      res.status(200).json(result.rows); // Send the results back to the client
    } else {
      res.status(404).json({ message: 'No requests found for this ad ID' }); // Handle no results case
    }
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
    // Ensure id is a valid number or the expected type
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    // Update the requests table to set the answer to 0 (rejected)
    const result = await pool.query('UPDATE requests SET answer = 0 WHERE id = $1 RETURNING *', [id]);

    // Check if the update was successful
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Error rejecting request' });
  }
});


// Assuming you have already imported necessary modules like express and your database connection

// Fetch ad details by ID
app.get('/ads/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM ads WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ad details:', error);
    res.status(500).json({ message: 'Error fetching ad details' });
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
app.post('/subscribe', async (req, res) => {
  const { userId, endpoint, keys } = req.body;

  // Log the received subscription data for debugging
  console.log('Received subscription:', { userId, endpoint, keys });

  // Check if all required fields are provided
  if (!userId || !endpoint || !keys) {
      return res.status(400).json({ message: 'Invalid subscription data.' });
  }

  try {
      // Check if a subscription already exists for the given userId
      const existingSubscription = await pool.query(
          'SELECT * FROM subscriptions WHERE user_id = $1',
          [userId]
      );

      if (existingSubscription.rowCount > 0) {
          // If subscription exists, no need to insert a new one
          console.log('User is already subscribed.');
          return res.status(200).json({ message: 'User already subscribed.' });
      }

      // Save the new subscription to the database if no existing subscription is found
      const result = await pool.query(
          'INSERT INTO subscriptions (user_id, endpoint, keys) VALUES ($1, $2, $3)',
          [userId, endpoint, JSON.stringify(keys)]
      );

      if (result.rowCount === 0) {
          return res.status(400).json({ message: 'Failed to subscribe user.' });
      }

      res.status(201).json({ message: 'Subscribed successfully!' });
  } catch (error) {
      console.error('Error saving subscription:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.post('/send-notification', async (req, res) => {
  const { title, message, userSubscription } = req.body;

  console.log('Received subscription:', userSubscription); // Log subscription details

  if (!userSubscription || !userSubscription.endpoint) {
    return res.status(400).json({ message: 'Invalid subscription data' });
  }

  try {
    await webpush.sendNotification(userSubscription.endpoint, JSON.stringify({ title, message }));
    res.status(200).json({ message: 'Notification sent' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.sendStatus(500);
  }
});

app.post('/requests', async (req, res) => {
  const { ad_id, user_id } = req.body;

  console.log('Received request to create:', { ad_id, user_id });

  try {
      // Check if the ad exists and get its owner
      const adOwnerCheckResult = await pool.query(
          'SELECT user_id FROM ads WHERE id = $1',
          [ad_id]
      );

      if (adOwnerCheckResult.rowCount === 0) {
          console.error('Ad not found.');
          return res.status(404).json({ message: 'Ad not found' });
      }

      const adOwnerId = adOwnerCheckResult.rows[0].user_id;

      // Check if the user is trying to request their own ad
      if (adOwnerId === user_id) {
          console.error('User cannot request their own event.');
          return res.status(400).json({ message: 'This is your event, you cannot request it.' });
      }

      // Check if the user has already requested the same ad
      const existingRequestResult = await pool.query(
          'SELECT * FROM requests WHERE ad_id = $1 AND user_id = $2',
          [ad_id, user_id]
      );

      if (existingRequestResult.rowCount > 0) {
          console.error('User has already requested this event.');
          return res.status(400).json({ message: 'You have already requested this event.' });
      }

      // Insert into requests table
      const result = await pool.query(
          'INSERT INTO requests (ad_id, user_id) VALUES ($1, $2)',
          [ad_id, user_id]
      );

      if (result.rowCount === 0) {
          console.error('Failed to create request in database.');
          return res.status(400).json({ message: 'Failed to create request' });
      }
      console.log('Request created successfully in database.');

      // Fetch the ad's details including the title and the user’s first name
      const adResult = await pool.query(
          `SELECT ads.title, ads.user_id AS ad_owner_id, users.first_name 
           FROM ads 
           JOIN users ON ads.user_id = users.id 
           WHERE ads.id = $1`, 
          [ad_id]
      );
      const ad = adResult.rows[0];

      if (!ad) {
          console.error('Ad not found.');
          return res.status(404).json({ message: 'Ad not found' });
      }

      console.log('Fetched ad details:', ad);

      // Fetch the owner's subscription from the database
      const subscriptionResult = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [adOwnerId]);
      const userSubscription = subscriptionResult.rows[0];

      console.log('User Subscription:', userSubscription);

      // Check if the subscription exists and is valid
      if (userSubscription && userSubscription.endpoint) {
          let keys;
          try {
              keys = typeof userSubscription.keys === 'string' 
                  ? JSON.parse(userSubscription.keys) 
                  : userSubscription.keys; 
          } catch (error) {
              console.error('Error parsing keys:', error);
              return res.status(500).json({ message: 'Failed to parse subscription keys' });
          }

          const subscription = {
              endpoint: userSubscription.endpoint,
              keys: keys,
          };

          console.log('Constructed Subscription Object:', subscription);

          // Prepare the payload with user's first name
          const payload = JSON.stringify({
              title: 'New Request',
              message: `User ${ad.first_name} has expressed interest in your ad: ${ad.title}`,
          });

          console.log('Payload to send:', payload);

          // Log VAPID keys for comparison
          console.log('Using VAPID Public Key:', process.env.VAPID_PUBLIC_KEY);
          console.log('Using VAPID Private Key:', process.env.VAPID_PRIVATE_KEY);

          // Send the push notification
          await webpush.sendNotification(subscription, payload);
          console.log('Notification sent successfully.');
      } else {
          console.error('No subscription found for user:', adOwnerId);
          return res.status(404).json({ message: 'No subscription found' });
      }

      res.status(201).json({ message: 'Request created successfully' });
  } catch (error) {
      console.error('Error creating request:', error);
      res.status(500).json({ message: 'Error creating request' });
  }
});


// Get user requests
app.get('/myrequests', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const result = await pool.query(`
      SELECT a.title, a.description, a.date, a.time, a.available, r.answer
      FROM requests r
      JOIN ads a ON r.ad_id = a.id
      WHERE r.user_id = $1
    `, [userId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
});
app.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body;
  const nodemailer = require('nodemailer');

  // Configure your email transport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: 'giorgos.gio45@gmail.com',
    subject: `Contact Us Message from ${name}`,
    text: `From ${email} ${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending email');
}
});
app.delete('/subscriptions/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
      // Attempt to delete the subscription associated with the userId
      const result = await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);

      // Check if any rows were affected by the delete operation
      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'Subscription not found' });
      }

      // Successfully deleted the subscription
      res.status(200).json({ message: 'Subscription deleted successfully' });
  } catch (error) {
      console.error('Error deleting subscription:', error);
      res.status(500).json({ message: 'Error deleting subscription' });
  }
});
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = result.rows[0]; // Get the user data from the query result
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
