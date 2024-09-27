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

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
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

  useEffect(() => {
    const userId = Cookies.get('userId');
    if (userId) {
      navigate('/create');
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
        Cookies.set('userId', result.userId);
        console.log('User ID saved in cookies:', Cookies.get('userId'));
        navigate('/profile');
      } else {
        alert(t('userIdError'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('networkError'));
    }
  };

  const handleSignIn = () => {
    navigate('/');
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
