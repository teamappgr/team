import * as React from 'react';
import { useEffect, useState } from 'react'; // Import useState
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';
import backround from './backimg.jpeg'; // Correct import
import CryptoJS from 'crypto-js';
import Visibility from '@mui/icons-material/Visibility'; // Import the visibility icon
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="/about">
        TeamGr
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const defaultTheme = createTheme();

export default function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // State to manage loading state
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    const userId = Cookies.get('userId');
    if (userId) {
      navigate('/');
    }
  }, [navigate]);
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const credentials = {
      email: data.get('email') as string,
      password: data.get('password') as string,
    };
  
    setLoading(true); // Set loading to true before the request

    try {
      const response = await fetch(process.env.REACT_APP_API + 'signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
    
      if (response.ok) {
        const result = await response.json();
        const encryptedCode: string = result.encryptedCode; // Retrieve the encrypted code from the response
        
        // Set the encrypted code in cookies
        Cookies.set('userId', encryptedCode, {
          expires: 14, // cookie expires in 14 days
          secure: true, // Use only if served over HTTPS
          sameSite: 'None', // Required if the frontend and backend are on different domains
          path: '/', // Ensure it's available for all routes
        });

        // Call the function to subscribe to push notifications
        await subscribeUserToPushNotifications(encryptedCode); // Pass the encryptedCode as userId
        
        console.log('User signed in successfully:', result);
        navigate('/profile');
      } else {
        alert(t('userIdError'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('networkError'));
    } finally {
      setLoading(false); // Reset loading state after the request completes
    }
  };

  const urlB64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };

  const subscribeUserToPushNotifications = async (userId: string) => {
    console.log('Attempting to subscribe...');

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Register the service worker
        const registration = await navigator.serviceWorker.register('service-worker.js');
        console.log('Service Worker registered:', registration);

        // Check if push manager is available and service worker is active
        const existingSubscription = await registration.pushManager.getSubscription();

        // If there's an existing subscription, unsubscribe from it
        if (existingSubscription) {
          await existingSubscription.unsubscribe();
          console.log('Unsubscribed from existing subscription.');
        }

        // Retrieve the VAPID public key from environment variables
        const applicationServerKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
        if (!applicationServerKey) {
          console.error('VAPID public key is not defined.');
          return;
        }

        // Convert the VAPID public key to the required Uint8Array format
        const convertedVapidKey = urlB64ToUint8Array(applicationServerKey);

        // Subscribe to push notifications using the converted VAPID public key
        const newSubscription: PushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
        console.log('Subscription request sent:', newSubscription);

        // Send the subscription to the backend
        const response = await fetch(`${process.env.REACT_APP_API}subscribe/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: newSubscription.endpoint,
            keys: newSubscription.toJSON().keys, // Ensure keys are sent as JSON
          }),
        });

        // Handle the response from the backend
        if (!response.ok) {
          const errorMessage = await response.json();
          console.error('Failed to subscribe:', errorMessage);
        } else {
          console.log('Subscription successful!');
        }
      } catch (error) {
        console.error('Subscription error:', error);
      }
    } else {
      console.error('Service workers or Push notifications are not supported in this browser.');
    }
  };

  const handleSignIn = () => {
    navigate('/signup'); // This function is not required anymore as it's not called
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <div 
        className="signin-container"
        style={{
          backgroundImage: `url(${backround})`, // Use imported image here
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '100vh',
        }}
      >
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <Box
            sx={{
              marginTop: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 1201,
              }}
            >
              <Button
                component="a"
                href="/team"
                variant="text"
                color="primary"
                style={{ textTransform: 'none', fontSize: 'inherit', padding: 0, minWidth: 'auto', color: 'gray' }}
              >
                {t('skip')}
              </Button>
            </Box>
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              {t('signIn')}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label={t('email')}
                name="email"
                autoComplete="email"
                autoFocus
              />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('password')}
              type={showPassword ? 'text' : 'password'} // Change input type based on visibility state
              id="password"
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={handleTogglePasswordVisibility}
                    style={{ padding: 0 }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />} {/* Toggle icon */}
                  </Button>
                ),
              }}
            />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading} // Disable button when loading
              >
                {loading ? 'Signing in...' : t('signIn')} {/* Display loading text */}
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link href="/team/#/forgot" variant="body2">
                    {t('forgotPassword')}
                  </Link>
                </Grid>
                <Grid item>
                  <Button
                    component="a"
                    onClick={handleSignIn}
                    variant="text"
                    color="primary"
                    style={{ textTransform: 'none', fontSize: 'inherit', padding: 0, minWidth: 'auto' }}
                  >
                    {t('dontHaveAccount')}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <Copyright sx={{ mt: 8, mb: 4 }} />
        </Container>
      </div>
    </ThemeProvider>
  );
}
