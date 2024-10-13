require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // Import PostgreSQL Pool
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const upload = require('./cloudinary'); // Multer configuration for cloudinary
const cookieParser = require('cookie-parser');
const CryptoJS = require('crypto-js'); // Ensure this line is present

const PORT = process.env.PORT || 5000;
const webpush = require('web-push'); // Add this line to import web-push
const argon2 = require('argon2');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.PUBLIC_URL || 'http://localhost:3000', // Allow requests from your frontend
    methods: ['GET', 'POST', 'DELETE', 'PUT'], // Specify allowed methods
    credentials: true, // Allow credentials (cookies)
  },
});

// Retrieve VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// Ensure keys are present
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

// Middleware for parsing cookies and JSON
app.use(cookieParser()); // Use cookie-parser middleware
app.use(express.json());
app.use(bodyParser.json()); // For parsing application/json
app.set('trust proxy', true); // Trust Render's proxy

// CORS middleware
app.use(cors({
  origin: process.env.PUBLIC_URL || 'http://localhost:3000', // Specify the frontend URL
  credentials: true, // Allow credentials (cookies)
}));

// Middleware to decrypt userId from cookies or request body/params
const decryptUserIdMiddleware = (req, res, next) => {
  const secretKey = process.env.SECRET_KEY || 'your-secret-key'; // Use environment variable for secret key
  console.log('Incoming request:', req.method, req.url);
  console.log('Cookies:', req.cookies);
  console.log('Request Params:', req.params);
  console.log('Request Body:', req.body);
  let encryptedUserId;

  // Check if encrypted userId exists in cookies or request params/body
  if (req.cookies.userId) {
    encryptedUserId = req.cookies.userId;
  } else if (req.params.userId) {
    encryptedUserId = req.params.userId;
  } else if (req.body.userId) {
    encryptedUserId = req.body.userId;
  }

  // If no encrypted userId is found, proceed to the next middleware/route
  if (!encryptedUserId) {
    return next();
  }

  try {
    // Decrypt the userId
    const bytes = CryptoJS.AES.decrypt(encryptedUserId, secretKey);
    const decryptedUserId = bytes.toString(CryptoJS.enc.Utf8);

    // Check if decryption was successful
    if (!decryptedUserId) {
      return res.status(400).json({ message: 'Invalid encrypted userId' });
    }

    // Attach the decrypted userId to the request object so it's available in subsequent routes
    req.decryptedUserId = decryptedUserId;
    next();
  } catch (error) {
    console.error('Error decrypting user ID:', error);
    res.status(500).json({ message: 'Error decrypting user ID' });
  }
};

// Apply the middleware globally
app.use(decryptUserIdMiddleware);

// Database connection pool
const pool = new Pool({
  host: process.env.SUPABASE_HOST,
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  database: process.env.SUPABASE_DATABASE,
  port: process.env.SUPABASE_PORT || 5432,
  ssl: { rejectUnauthorized: false },
});
app.post('/signin', async (req, res) => {
  const { email, password, subscribe, endpoint, keys } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      // Compare the hashed password with the provided password using argon2
      const match = await argon2.verify(user.password, password);

      if (match) {


        // If the user subscribes, insert into subscriptions table
        if (subscribe) {
          const existingSubscription = await pool.query(
            'SELECT * FROM subscriptions WHERE user_id = $1',
            [user.id]
          );

          // Check if the user is already subscribed
          if (existingSubscription.rowCount === 0) {
            // Insert new subscription into the database
            await pool.query(
              'INSERT INTO subscriptions (user_id, endpoint, keys) VALUES ($1, $2, $3)',
              [user.id, endpoint, JSON.stringify(keys)] // Ensure keys are JSON stringified
            );
          }
        }

        return res.status(200).json({ userId: user.id, message: 'Sign-in successful' });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during sign-in: ', error);
    return res.status(500).json({ message: 'Error during sign-in' });
  }
});

// Sign-Up Endpoint
app.post('/signup', upload.single('image'), async (req, res) => {
  const { firstName, lastName, email, phone, instagramAccount, password, university, gender, subscribe, endpoint, keys } = req.body;
  const imageUrl = req.file.path; // The URL of the uploaded image from Cloudinary

  try {
    // Hash the password before storing it using argon2
    const hashedPassword = await argon2.hash(password);

    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, phone, instagram_account, password, image_url, university, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [firstName, lastName, email, phone, instagramAccount, hashedPassword, imageUrl, university, gender]
    );

    const userId = result.rows[0].id;


    // If the user subscribes, insert into subscriptions table
    if (subscribe) {
      const existingSubscription = await pool.query(
        'SELECT * FROM subscriptions WHERE user_id = $1',
        [userId]
      );

      // Check if the user is already subscribed
      if (existingSubscription.rowCount === 0) {
        // Insert new subscription into the database
        await pool.query(
          'INSERT INTO subscriptions (user_id, endpoint, keys) VALUES ($1, $2, $3)',
          [userId, endpoint, JSON.stringify(keys)] // Ensure keys are JSON stringified
        );
      }
    }

    return res.status(201).json({ userId, message: 'User created successfully' });
  } catch (error) {
    console.error('Error during sign-up: ', error);
    return res.status(500).json({ message: 'Error during sign-up' });
  }
});


const slugify = require('slugify'); // Install slugify using npm

app.post('/ads', async (req, res) => {
  const { title, description, min, max, date, time,  info, autoreserve } = req.body;
  const userId=req.decryptedUserId;
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
    const adResult = await pool.query(
      'INSERT INTO ads (title, description, user_id, min, max, date, time, info, available, autoreserve) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [title, description, userId, min, max, date, time, info, max, autoreserve]
    );

    const adId = adResult.rows[0].id;

    // Create the group chat. The slug is now generated by the database automatically.
    const groupChatResult = await pool.query(
      'INSERT INTO Groups (group_name, created_by, ad_id) VALUES ($1, $2, $3) RETURNING group_id, slug',
      [`${title} ${date}`, userId, adId] // No need to manually generate the slug
    );

    const groupId = groupChatResult.rows[0].group_id;
    const slug = groupChatResult.rows[0].slug;  // Get the auto-generated slug

    // Insert the first group member with admin rights
    await pool.query(
      'INSERT INTO groupmembers (user_id, group_id, is_admin) VALUES ($1, $2, $3)',
      [userId, groupId, true]
    );

    res.status(201).json({ adId, groupId, slug, message: 'Ad and group chat created successfully' });
  } catch (error) {
    console.error('Error creating ad: ', error);
    res.status(500).json({ message: 'Error creating ad' });
  }
});


app.get('/ads1', async (req, res) => {
  const userId = req.decryptedUserId; // Use decrypted userId from middleware

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const result = await pool.query('SELECT * FROM ads WHERE user_id = $1', [userId]);
    
    // Check if ads were found
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No ads found for this user' });
    }

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

app.get('/api/requests', async (req, res) => {
  const userId = req.decryptedUserId// Use decrypted userId from middleware

  if (!userId) {
    return res.status(400).json({ message: 'User ID not provided' });
  }

  try {
    // Query to fetch requests for the user
    const requestResult = await pool.query('SELECT * FROM requests WHERE user_id = $1', [userId]);
    const requests = requestResult.rows;

    // For each request, join with ads to get the necessary fields
    const requestsWithAds = await Promise.all(requests.map(async (request) => {
      const adResult = await pool.query('SELECT title, description, available, date, time FROM ads WHERE id = $1', [request.ad_id]);
      const ad = adResult.rows[0]; // Access the first row of the result

      return { ...request, ad }; // Combine request and ad data
    }));

    res.json(requestsWithAds); // Send combined data as response
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  const requestId = parseInt(req.params.id); // Parse request ID from URL parameters
  const userId = parseInt(req.decryptedUserId); // Get user ID from Authorization header

  if (isNaN(requestId) || isNaN(userId)) {
    return res.status(400).send('Invalid request ID or user ID');
  }

  try {
    // Fetch the request to check its answer and get the associated ad_id
    const requestResult = await pool.query('SELECT * FROM requests WHERE id = $1', [requestId]);
    const request = requestResult.rows[0];

    if (!request) {
      return res.status(404).send('Request not found');
    }

    // If request.answer is 1, increase the availability of the ad
    if (request.answer === 1) {
      const updateResult = await pool.query('UPDATE ads SET available = available + 1 WHERE id = $1', [request.ad_id]);
      if (updateResult.rowCount === 0) {
        console.warn(`No ads updated for ad_id: ${request.ad_id}`);
      }
    }

    // Find the group_id from the groups table using ad_id
    const groupResult = await pool.query('SELECT group_id FROM groups WHERE ad_id = $1', [request.ad_id]);
    const group = groupResult.rows[0];

    if (group) {
      // Delete from groupmembers where user_id matches and group_id matches
      const deleteMemberResult = await pool.query('DELETE FROM groupmembers WHERE user_id = $1 AND group_id = $2', [userId, group.group_id]);

      // Log how many rows were deleted
    } else {
      console.warn(`Group not found for Ad ID: ${request.ad_id}`);
    }

    // Delete the request from requests table
    const result = await pool.query('DELETE FROM requests WHERE id = $1', [requestId]);

    // Check if any rows were affected by the delete operation
    if (result.rowCount > 0) {
      res.status(204).send(); // No content, successful deletion
    } else {
      res.status(404).send('Request not found');
    }
  } catch (error) {
    console.error('Error during deletion process:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.post('/requests/:id/accept', async (req, res) => {
  const { id } = req.params; // Get request ID from URL parameters
  
  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Update the requests table to set the answer to 1 (accepted)
    const updateRequestResult = await pool.query(
      'UPDATE requests SET answer = 1 WHERE id = $1 RETURNING ad_id, user_id',
      [id]
    );

    // If no request was found, return an error
    if (updateRequestResult.rowCount === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const adId = updateRequestResult.rows[0].ad_id; // Get the ad_id for the updated request
    const userId = updateRequestResult.rows[0].user_id; // Get the user_id for the updated request

    // Decrease the available count in the ads table
    await pool.query('UPDATE ads SET available = available - 1 WHERE id = $1', [adId]);

    // Fetch the group_id associated with the ad_id
    const groupResult = await pool.query(
      'SELECT group_id FROM groups WHERE ad_id = $1',
      [adId]
    );

    // If no group associated, return an error
    if (groupResult.rowCount === 0) {
      throw new Error('No group associated with this ad');
    }

    const groupId = groupResult.rows[0].group_id; // Get the group_id

    // Insert the user as a member of the group
    await pool.query(
      'INSERT INTO groupmembers (user_id, group_id) VALUES ($1, $2)',
      [userId, groupId]
    );

    // Commit the transaction
    await pool.query('COMMIT');

    // Prepare to send the notification after successful request acceptance
    const subscriptionResult = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
    const userSubscription = subscriptionResult.rows[0];

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

      // Prepare the payload with notification details
      const payload = JSON.stringify({
        title: 'New Request',
        message: `User accepted your request`, // Changed to be more clear
      });

      // Send the push notification
      await webpush.sendNotification(subscription, payload);
    } else {
      console.error('No subscription found for user:', userId);
      return res.status(404).json({ message: 'No subscription found' });
    }

    // Send a response indicating success
    res.status(200).json({ message: 'Request accepted successfully and user added to group' });

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
app.delete('/ads/:id', async (req, res) => {
  const { id } = req.params;

  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // First, delete all requests associated with the ad
    await client.query('DELETE FROM requests WHERE ad_id = $1', [id]);

    // Then, delete the ad itself
    const result = await client.query('DELETE FROM ads WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ad not found' });
    }

    // Commit the transaction
    await client.query('COMMIT');
    res.json({ message: 'Ad and associated requests deleted successfully', deletedAd: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting ad and requests:', error);
    res.status(500).json({ error: 'An error occurred while deleting the ad and its requests' });
  } finally {
    client.release();
  }
});
app.delete('/requests/:id', async (req, res) => {
  const { id } = req.params; // Get the request ID from the request parameters

  try {
    const result = await pool.query('DELETE FROM requests WHERE id = $1 RETURNING *', [id]);

    // Check if any row was deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ message: 'Error deleting request' });
  }
});

app.get('/profile', async (req, res) => {
  const userId = req.decryptedUserId; // Use decrypted userId from the middleware

  if (!userId) {
    return res.status(400).json({ message: 'User ID not provided' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile: ', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});


app.put('/profile', async (req, res) => {
  const userId = req.decryptedUserId; // Use decrypted userId
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

app.get('/subscriptions', async (req, res) => {
  const userId = req.decryptedUserId; // Use decrypted userId

  try {
    const result = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found or not subscribed' });
    }

    res.status(200).json({ subscribed: true });
  } catch (error) {
    console.error('Error fetching subscription: ', error);
    res.status(500).json({ message: 'Error fetching subscription' });
  }
});


// Toggle subscription
app.post('/subscriptions/toggle', async (req, res) => {
  const userId = req.decryptedUserId; // Use decrypted userId from the middleware
  const { subscribe, endpoint, keys } = req.body;

  try {
    if (subscribe) {
      // Subscribe the user: Add to subscriptions table
      const existingSubscription = await pool.query(
        'SELECT * FROM subscriptions WHERE user_id = $1',
        [userId]
      );

      // Check if the user is already subscribed
      if (existingSubscription.rowCount > 0) {
        return res.status(200).json({ message: 'User already subscribed.' });
      }

      // Insert new subscription into the database
      const result = await pool.query(
        'INSERT INTO subscriptions (user_id, endpoint, keys) VALUES ($1, $2, $3)',
        [userId, endpoint, JSON.stringify(keys)] // Ensure keys are JSON stringified
      );

      if (result.rowCount > 0) {
        return res.status(201).json({ message: 'Subscription added successfully.' });
      } else {
        return res.status(400).json({ message: 'Failed to add subscription.' });
      }
    } else {
      // Unsubscribe the user: Remove from subscriptions table
      const result = await pool.query(
        'DELETE FROM subscriptions WHERE user_id = $1',
        [userId]
      );

      if (result.rowCount > 0) {
        return res.status(200).json({ message: 'Unsubscribed successfully.' });
      } else {
        return res.status(404).json({ message: 'Subscription not found.' });
      }
    }
  } catch (error) {
    console.error('Error toggling subscription: ', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Delete a subscription
app.delete('/subscriptions/:userId', async (req, res) => {
  const userId = req.decryptedUserId; // Use decrypted userId from the middleware

  try {
    const result = await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found or no subscription exists' });
    }

    res.status(200).json({ message: 'Subscription deleted successfully', subscribed: false });
  } catch (error) {
    console.error('Error deleting subscription: ', error);
    res.status(500).json({ message: 'Error deleting subscription' });
  }
});


app.post('/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body;
  const userId = parseInt(req.decryptedUserId); 
  // Log the received subscription data for debugging

  // Validate the incoming data
  if (!userId || !endpoint || !keys) {
    return res.status(400).json({ message: 'Invalid subscription data.' });
  }

  try {
    // Check if the user already has a subscription
    const existingSubscription = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    if (existingSubscription.rowCount > 0) {
      // If subscription exists, update the existing subscription with new data
      const result = await pool.query(
        'UPDATE subscriptions SET endpoint = $1, keys = $2 WHERE user_id = $3',
        [endpoint, JSON.stringify(keys), userId]
      );

      if (result.rowCount > 0) {
        return res.status(200).json({ message: 'Subscription updated successfully.' });
      } else {
        return res.status(400).json({ message: 'Failed to update subscription.' });
      }
    }

    // If no subscription exists, insert a new one
    const result = await pool.query(
      'INSERT INTO subscriptions (user_id, endpoint, keys) VALUES ($1, $2, $3)',
      [userId, endpoint, JSON.stringify(keys)]
    );

    if (result.rowCount > 0) {
      res.status(201).json({ message: 'Subscribed successfully!' });
    } else {
      res.status(400).json({ message: 'Failed to subscribe user.' });
    }
  } catch (error) {
    console.error('Error handling subscription:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.post('/send-notification', async (req, res) => {
  const { title, message, userSubscription } = req.body;


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
  const { ad_id } = req.body; // Get ad_id from the request body
  const user_id = parseInt(req.decryptedUserId); // Use decrypted userId and parse it properly

  if (!user_id || !ad_id) {
    return res.status(400).json({ message: 'User ID or Ad ID not provided' });
  }

  try {
    // Check if the ad exists and get its owner
    const adOwnerCheckResult = await pool.query('SELECT user_id FROM ads WHERE id = $1', [ad_id]);

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
    const existingRequestResult = await pool.query('SELECT * FROM requests WHERE ad_id = $1 AND user_id = $2', [ad_id, user_id]);

    if (existingRequestResult.rowCount > 0) {
      console.error('User has already requested this event.');
      return res.status(400).json({ message: 'You have already requested this event.' });
    }

    // Insert into the requests table
    const result = await pool.query('INSERT INTO requests (ad_id, user_id) VALUES ($1, $2)', [ad_id, user_id]);

    if (result.rowCount === 0) {
      console.error('Failed to create request in database.');
      return res.status(400).json({ message: 'Failed to create request' });
    }

    // Fetch the ad's details, including the title and the user's first name
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

    // Fetch the owner's subscription from the database
    const subscriptionResult = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [adOwnerId]);
    const userSubscription = subscriptionResult.rows[0];

    // Check if the subscription exists and is valid
    if (userSubscription && userSubscription.endpoint) {
      let keys;
      try {
        keys = typeof userSubscription.keys === 'string' ? JSON.parse(userSubscription.keys) : userSubscription.keys;
      } catch (error) {
        console.error('Error parsing keys:', error);
        return res.status(500).json({ message: 'Failed to parse subscription keys' });
      }

      const subscription = {
        endpoint: userSubscription.endpoint,
        keys: keys,
      };

      // Prepare the payload with user's first name
      const payload = JSON.stringify({
        title: 'New Request',
        message: `A user has expressed interest in your ad: ${ad.title}`,
      });

      // Send the push notification
      await webpush.sendNotification(subscription, payload);
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
// Unsubscribe from Push Notifications
app.post('/unsubscribe', async (req, res) => {
  const { userId } = req.body;

  // Validate the incoming data
  if (!userId) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }

  try {
    // Delete the subscription for the user from the subscriptions table
    const result = await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);

    if (result.rowCount > 0) {
      return res.status(200).json({ message: 'Unsubscribed successfully.' });
    } else {
      return res.status(404).json({ message: 'Subscription not found.' });
    }
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/users', async (req, res) => {
  const user_id = parseInt(req.decryptedUserId); // Use decrypted userId and parse it properly

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);

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

app.get('/ads/:id', async (req, res) => {
  const adId = req.params.id;

  // Validate adId
  if (isNaN(adId) || adId <= 0) {
    return res.status(400).json({ message: 'Invalid ad ID' });
  }


  try {
    const query = 'SELECT * FROM ads WHERE id = $1'; // Use $1 for PostgreSQL
    
    // Execute the query
    const result = await pool.query(query, [adId]);

    // Check if any rows were returned
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Return the first ad found
    res.json(result.rows[0]); 
  } catch (error) {
    console.error('Error fetching ad:', error);
    console.error('Error details:', error.message); // Log the error message
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.get('/chats', async (req, res) => {
  const userId = req.decryptedUserId; // Extract userId from middleware

  if (!userId) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  try {
    const result = await pool.query(
      `SELECT g.slug, g.group_name 
       FROM GroupMembers gm
       JOIN Groups g ON gm.group_id = g.group_id
       WHERE gm.user_id = $1`, 
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No chats found' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch group chats' });
  }
});



app.get('/messages/:slug', async (req, res) => {
  const { slug } = req.params;
  const userId = req.decryptedUserId;

  try {
      // Check if the user is a member of the group
      const groupResult = await pool.query(
          `SELECT g.group_id 
           FROM Groups g
           JOIN GroupMembers gm ON g.group_id = gm.group_id
           WHERE g.slug = $1 AND gm.user_id = $2`,
          [slug, userId]
      );

      if (groupResult.rowCount === 0) {
          return res.status(403).json({ error: 'You are not a member of this group' });
      }

      const groupId = groupResult.rows[0].group_id;

      // Fetch messages for the group
      const messagesResult = await pool.query(
          `SELECT m.message_id, m.message_text, m.sent_at, u.id as sender_id, u.first_name, u.last_name 
           FROM Messages m
           JOIN Users u ON m.sender_id = u.id 
           WHERE m.group_id = $1 
           ORDER BY m.sent_at ASC`,
          [groupId]
      );

      const messages = messagesResult.rows.map(msg => ({
          message_id: msg.message_id,
          message_text: msg.message_text,
          created_at: moment(msg.sent_at).format('YYYY-MM-DD HH:mm:ss'),
          sender_id: msg.sender_id, // Include sender_id here
          first_name: msg.first_name,
          last_name: msg.last_name,
      }));

      res.json(messages);
  } catch (error) {
      console.error('Error fetching messages: ', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
  }
});



app.get('/groups/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await pool.query('SELECT group_name FROM Groups WHERE slug = $1', [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(result.rows[0]); // Send back the group name
  } catch (error) {
    console.error('Error fetching group name:', error);
    res.status(500).json({ message: 'Error fetching group name' });
  }
});
app.get('/groups/members/:slug', async (req, res) => {
  const { slug } = req.params;
  const userId = req.decryptedUserId;

  try {
    // Check if the user is a member of the group
    const groupResult = await pool.query(
      `SELECT g.group_id 
       FROM Groups g
       JOIN GroupMembers gm ON g.group_id = gm.group_id
       WHERE g.slug = $1 AND gm.user_id = $2`,
      [slug, userId]
    );

    if (groupResult.rowCount === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const groupId = groupResult.rows[0].group_id;

    // Fetch members for the group
    const membersResult = await pool.query(
      `SELECT u.first_name, u.last_name 
       FROM Users u
       JOIN GroupMembers gm ON u.id = gm.user_id
       WHERE gm.group_id = $1`,
      [groupId]
    );

    const members = membersResult.rows;

    res.json(members);
  } catch (error) {
    console.error('Error fetching group members: ', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
});

const moment = require('moment');

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle joining a group
  socket.on('joinGroup', async ({ slug, userId }) => {
    try {
      // Log the received encrypted userId
      console.log('Encrypted userId received for joinGroup:', userId);

      const secretKey = process.env.SECRET_KEY || 'your-secret-key';
      const bytes = CryptoJS.AES.decrypt(userId, secretKey);
      const decryptedUserId = bytes.toString(CryptoJS.enc.Utf8);

      // Log the decrypted userId
      console.log('Decrypted userId for joinGroup:', decryptedUserId);

      // Check if decryption was successful
      if (!decryptedUserId) {
        return console.error('Invalid encrypted userId for Socket.IO');
      }

      // Fetch the group ID from the slug
      const groupResult = await pool.query(`SELECT group_id FROM Groups WHERE slug = $1`, [slug]);
      if (groupResult.rowCount === 0) {
        return console.error('Group not found');
      }

      // Join the user to the room
      socket.join(slug);
      console.log(`User ${decryptedUserId} joined group ${slug}`);

    } catch (error) {
      console.error('Error joining group:', error);
    }
  });

  // Handle sending a message
  socket.on('sendMessage', async ({ slug, message, senderId }) => {
    try {
      // Log the received encrypted senderId
      console.log('Encrypted senderId received for sendMessage:', senderId);

      const secretKey = process.env.SECRET_KEY || 'your-secret-key';
      const bytes = CryptoJS.AES.decrypt(senderId, secretKey);
      const decryptedSenderId = bytes.toString(CryptoJS.enc.Utf8);

      // Log the decrypted senderId
      console.log('Decrypted senderId for sendMessage:', decryptedSenderId);

      // Check if decryption was successful
      if (!decryptedSenderId) {
        return console.error('Invalid encrypted senderId for Socket.IO');
      }

      // Fetch the group ID from the slug
      const groupResult = await pool.query(`SELECT group_id FROM Groups WHERE slug = $1`, [slug]);
      if (groupResult.rowCount === 0) {
        return console.error('Group not found');
      }

      const groupId = groupResult.rows[0].group_id;

      // Insert the message into the database
      const insertResult = await pool.query(
        `INSERT INTO Messages (message_text, sender_id, group_id, sent_at)
         VALUES ($1, $2, $3, NOW()) RETURNING message_id, sent_at`,
        [message, decryptedSenderId, groupId]
      );

      const newMessageId = insertResult.rows[0].message_id;
      const sentAt = insertResult.rows[0].sent_at;

      // Fetch the sender's first name and last name
      const userResult = await pool.query(`SELECT first_name, last_name FROM Users WHERE id = $1`, [decryptedSenderId]);
      if (userResult.rowCount === 0) {
        return console.error('User not found');
      }

      const { first_name, last_name } = userResult.rows[0];

      // Create the message object to broadcast
      const newMessage = {
        message_id: newMessageId,
        message_text: message,
        sender_id: decryptedSenderId,
        first_name,
        last_name,
        created_at: moment(sentAt).format('YYYY-MM-DD HH:mm:ss'),
      };

      // Broadcast the message to the group (excluding the sender)
      socket.to(slug).emit('newMessage', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
});



server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
