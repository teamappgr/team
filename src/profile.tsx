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
  Spinner,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
} from '@chakra-ui/react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout'; 
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { MdBuild, MdCall } from "react-icons/md";
import { EmailIcon } from '@chakra-ui/icons'; // Import EmailIcon

const Profile = () => {
  const { t } = useTranslation(); 
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    instagram_account: '',
    verified: false,
  });
  const [loading, setLoading] = useState(true); 
  const toast = useToast();
  const navigate = useNavigate();

  const userId = Cookies.get('userId');

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
      } finally {
        setLoading(false); 
      }
    };

    fetchUserData();
  }, [userId, toast, navigate, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prevState => ({ ...prevState, [name]: value }));
  };
  

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
    Cookies.remove('userId'); 
    navigate('/signin'); 
  };

  return (
    <Layout>
      <Box p={5}>
        <Heading mb={6}>{t('contactInfo')}</Heading>

        {loading ? ( 
          <Spinner size="xl" />
        ) : (
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

            <Box>
              <Stack direction='row'>
                <Badge colorScheme={profileData.verified ? 'green' : 'red'}>
                  {profileData.verified ? t('verified') : t('notVerified')}
                </Badge>
              </Stack>
            </Box>

            <Button 
              colorScheme="teal" 
              onClick={handleSubmit} 
              isLoading={loading}
            >
              {t('update')}
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleSignOut}
            >
              {t('signout')}
            </Button>
          </Stack>
        )}

        <Stack direction='row' spacing={4} mt={5}>
          <Popover>
            <PopoverTrigger>
              <Button leftIcon={<MdBuild />} colorScheme='pink' variant='solid'>
              {t('language')}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>{t('changelanguage')}</PopoverHeader>
              <PopoverBody>
                
                <LanguageSelector />
              </PopoverBody>
            </PopoverContent>
          </Popover>
          
          <Button
            leftIcon={<EmailIcon />}
            colorScheme='teal'
            variant='solid'
            onClick={() => navigate('/contactus')}
          >
            {t('contactus')}
          </Button>
        </Stack>
      </Box>
    </Layout>
  );
};

export default Profile;
