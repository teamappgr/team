import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  useToast,
} from '@chakra-ui/react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout'; // Import the Layout component
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { t } = useTranslation(); // Use translation hook
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    instagram_account: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const userId = Cookies.get('userId');

  // Fetch user data when the component loads
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        toast({
          title: t('userIdError'),
          description: t('dontHaveAccount'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/signin');
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API}profile/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        toast({
          title: t('networkError'),
          description: t('userIdError'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchUserData();
  }, [userId, toast, navigate, t]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prevState => ({ ...prevState, [name]: value }));
  };

  // Handle form submission (Update user data)
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API}profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast({
        title: t('submit'),
        description: t('Profile updated successfully'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: t('networkError'),
        description: t('userIdError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Cookies.remove('userId'); // Clear userId cookie
    navigate('/signin'); // Redirect to sign-in page
  };

  return (
    <Layout>
    <Box p={5}>
      <Heading mb={6}>{t('contactInfo')}</Heading>
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>{t('firstName')}</FormLabel>
          <Input
            name="first_name"
            value={profileData.first_name}
            onChange={handleChange}
            placeholder={t('firstName')}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t('lastName')}</FormLabel>
          <Input
            name="last_name"
            value={profileData.last_name}
            onChange={handleChange}
            placeholder={t('lastName')}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t('email')}</FormLabel>
          <Input
            name="email"
            value={profileData.email}
            onChange={handleChange}
            placeholder={t('email')}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t('phone')}</FormLabel>
          <Input
            name="phone"
            value={profileData.phone}
            onChange={handleChange}
            placeholder={t('phone')}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t('instagramInfo')}</FormLabel>
          <Input
            name="instagram_account"
            value={profileData.instagram_account}
            onChange={handleChange}
            placeholder={t('instagramInfo')}
          />
        </FormControl>
        <Button 
          colorScheme="teal" 
          onClick={handleSubmit} 
          isLoading={loading}
        >
          {t('Update')}
        </Button>
        <Button 
          colorScheme="red" 
          onClick={handleSignOut}
        >
          {t('signOut')}
        </Button>
      </Stack>
    </Box>
    </Layout>
  );
};

export default Profile;
