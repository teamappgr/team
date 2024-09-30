import * as React from 'react';
import { useEffect } from 'react';
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
import CloseIcon from '@mui/icons-material/Close'; // Import CloseIcon

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="/about">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const defaultTheme = createTheme();

export default function SignIn({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const userId = Cookies.get('userId');
    if (userId) {
      navigate('/team');
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const credentials = {
      email: data.get('email') as string,
      password: data.get('password') as string,
    };

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
        const userId: string = result.userId; // Explicitly define userId type
        Cookies.set('userId', userId, { expires: 7 }); // The cookie will expire in 7 days
        console.log('User signed up successfully:', result);

        // Proceed to subscribe to push notifications
        await subscribeUserToPushNotifications(userId);

        navigate('/profile');
      } else {
        alert(t('userIdError'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('networkError'));
    }
  };
  const urlB64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };
  const subscribeUserToPushNotifications = async (userId: string) => { // Explicitly define userId type
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
            const response = await fetch(`${process.env.REACT_APP_API}subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId, // Pass the userId here
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
  return (
    <ThemeProvider theme={defaultTheme}>
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
              onClick={onClose} // Call onClose to close the modal
              variant="text"
              color="primary"
              style={{ textTransform: 'none', fontSize: 'inherit', padding: 0, minWidth: 'auto', color: 'gray' }}
            >
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
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {t('signIn')}
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  {t('forgotPassword')}
                </Link>
              </Grid>
              <Grid item>
                <Button
                  component="a"
                  onClick={() => navigate('/')} // Replace with your desired navigation
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
    </ThemeProvider>
  );
}
