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
  IconButton,
  Switch,  // Import Chakra's Switch component
} from '@chakra-ui/react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout'; 
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { MdBuild, MdCall } from "react-icons/md";
import { EmailIcon,BellIcon } from '@chakra-ui/icons'; // Import EmailIcon

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
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false); // Subscription state
  const toast = useToast();
  const navigate = useNavigate();

  const userId = Cookies.get('userId');
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive notifications.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else if (permission === 'denied') {
        toast({
          title: 'Notifications Blocked',
          description: 'You have blocked notifications. Please enable them in your browser settings.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };
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
        const userId = Cookies.get('userId'); // Get the userId from the cookies

        const response = await fetch(`${process.env.REACT_APP_API}profile/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setProfileData(data);

        // Fetch subscription status
        const subscriptionResponse = await fetch(`${process.env.REACT_APP_API}subscriptions/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setIsSubscribed(subscriptionData.subscribed || false); // Updated here
        } else {
          // Handle cases where the user is not found or other errors
          const errorData = await subscriptionResponse.json();

        }
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
  }, [userId, toast, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prevState => ({ ...prevState, [name]: value }));
  };
  const urlB64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };
  const handleSubscriptionToggle = async (checked: boolean) => {
    try {
      if (checked) {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setIsSubscribed(false);
          toast({
            title: t('permissionDenied'),
            description: t('notificationsAreDisabled'),
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
  
        // Check for existing service worker registration
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (!registration) {
            throw new Error('Service worker not registered');
          }
  
          // Ensure VAPID key is defined
          const applicationServerKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
          if (!applicationServerKey) {
            throw new Error('VAPID public key is not defined');
          }
  
          // Convert VAPID key to Uint8Array
          const convertedVapidKey = urlB64ToUint8Array(applicationServerKey);
  
          // Subscribe to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey, // This should now be guaranteed to be a string
          });
  
          // Send subscription data to backend
          const response = await fetch(`${process.env.REACT_APP_API}subscriptions/toggle/${userId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              subscribe: checked,
              endpoint: subscription.endpoint,
              keys: subscription.toJSON().keys,
            }),
          });
  
          if (!response.ok) {
            throw new Error('Failed to update subscription');
          }
        } else {
          throw new Error('Push notifications are not supported in this browser');
        }
      } else {
        // Unsubscribe
        const response = await fetch(`${process.env.REACT_APP_API}subscriptions/toggle/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, subscribe: checked }),
        });
  
        if (!response.ok) {
          throw new Error('Failed to update subscription');
        }
      }
  
      setIsSubscribed(checked);
      toast({
        title: checked ? t('subscribed') : t('unsubscribed'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: t('networkError'),
        description: t('subscriptionToggleFailed'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const userId = Cookies.get('userId'); // Get the userId from the cookies

      const response = await fetch(`${process.env.REACT_APP_API}profile/${userId}`, {
        method: 'PUT',
        credentials: 'include', // Include cookies in the request
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

  const handleSignOut = async () => {
    try {
        const userId = Cookies.get('userId');

        if (!userId) {
            toast({
                title: 'Error',
                description: 'User ID not found.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        Cookies.remove('userId');
        navigate('/signin');

        const response = await fetch(`${process.env.REACT_APP_API}subscriptions/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete subscription');
        }

        toast({
            title: 'Success',
            description: 'Subscription deleted successfully.',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });

    } catch (error) {
        // Error handling
    }
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

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="subscription-switch" mb="0">
                {t('getnotifications')}
              </FormLabel>
              <Switch
                id="subscription-switch"
                isChecked={isSubscribed}
                onChange={(e) => handleSubscriptionToggle(e.target.checked)}
              />
            <Popover>
          <PopoverTrigger>
          {/* Use IconButton with BellIcon as the trigger */}
           <IconButton 
         aria-label="Notifications" 
         icon={<BellIcon />} 
         colorScheme="teal" 
           />
         </PopoverTrigger>
        <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>{t('enablebrowser')}</PopoverHeader>
       <PopoverBody>
       {/* Button to request notification permission */}
         <Button onClick={requestNotificationPermission} colorScheme="teal">
          {t('enablebrowser')}
        </Button>
        </PopoverBody>
        </PopoverContent>
            </Popover>
            </FormControl>
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
