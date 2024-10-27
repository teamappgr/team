import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
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
  Switch,
  Editable,
  EditableInput,
  EditablePreview,
  ButtonGroup,
  Flex,
  useEditableControls,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, EditIcon, EmailIcon, InfoIcon,SettingsIcon } from '@chakra-ui/icons';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { MdBuild } from 'react-icons/md';

type ProfileData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  instagram_account: string;
  verified: boolean;
};

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
  const [isEdited, setIsEdited] = useState<boolean>(false); // Track if any field is edited
  const [tempEmail, setTempEmail] = useState(profileData.email);

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
  const handleChange = async (field: keyof ProfileData, value: string) => {
    // Check for email field
    if (field === 'email') {
      // Call the backend to check if the email exists
      const response = await fetch(`${process.env.REACT_APP_API}check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: value }),
      });
  
      const data = await response.json();
  
      if (data.exists) {
        // Show toast notification if the email exists
        toast({
          title: "Email already exists.",
          description: "Please enter a different email address.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return; // Prevent changing the value if the email exists
      }
    }
  
    // Update state only if the email does not exist
    setProfileData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
    setIsEdited(true); // Mark as edited when any field changes
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
        description: t('Profileupdatedsuccessfully'),
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
      setIsEdited(false); // Mark as edited when any field changes
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
  
  function EditableControls() {
    const { isEditing, getSubmitButtonProps, getCancelButtonProps, getEditButtonProps } = useEditableControls();

    return isEditing ? (
      <ButtonGroup justifyContent="center" size="sm">
        <IconButton icon={<CheckIcon />} aria-label="Submit" {...getSubmitButtonProps()} />
        <IconButton icon={<CloseIcon />} aria-label="Cancel" {...getCancelButtonProps()} />
      </ButtonGroup>
    ) : (
      <Flex justifyContent="center">
        <IconButton size="sm" icon={<EditIcon />} aria-label="Edit" {...getEditButtonProps()} />
      </Flex>
    );
  }
  return (
    <Layout>
      <Box p={5}>
        <Heading mb={6} color="teal.600">{t('contactInfo')} </Heading>

        {loading ? ( 
          <Spinner size="xl" />
        ) : (
          <Stack spacing={4}>
{[
  { label: 'firstName', field: 'first_name' as const },
  { label: 'lastName', field: 'last_name' as const },
  { label: 'email', field: 'email' as const },
  { label: 'phone', field: 'phone' as const },
  { label: 'instagramInfo', field: 'instagram_account' as const },
].map(({ label, field }) => (
  <FormControl key={field}>
    <FormLabel fontWeight="bold">{t(label)}</FormLabel>
    <Editable
      defaultValue={profileData[field]}
      onSubmit={(value) => handleChange(field, value)}
      fontSize="md"
      isPreviewFocusable={false}
      display="flex"
      alignItems="center"
    >
      <EditablePreview />
      <EditableInput />
      <Box ml={2}>
        <EditableControls />
      </Box>
    </Editable>
  </FormControl>
))}


            <Box>
              <Stack direction="row">
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
                  <IconButton aria-label="Notifications" icon={<SettingsIcon />} colorScheme="teal" />
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverHeader>{t('enablebrowser')}</PopoverHeader>
                  <PopoverBody>
                  <Button onClick={requestNotificationPermission} colorScheme="teal">
      {t('enablebrowser')}
    </Button>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </FormControl>

            {isEdited && (
              <Button colorScheme="teal" onClick={handleSubmit} isLoading={loading}>
                {t('update')}
              </Button>
            )}
            <Button colorScheme="red" onClick={handleSignOut}>
              {t('signout')}
            </Button>
          </Stack>
        )}

        <Stack direction='row' spacing={4} mt={5}>
          <Popover>
            <PopoverTrigger>
              <Button leftIcon={<MdBuild />} colorScheme='pink' variant='solid'         width="100%"
        size="lg">
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
          

          
        </Stack>
        <Box
      position="relative"
      width="100vw"
      left="50%"
      right="50%"
      marginLeft="-50vw"
      marginRight="-50vw"
      p={4}
    >
      <Button
        leftIcon={<EmailIcon />}
        colorScheme="teal"
        width="100%"
        size="lg"
        variant="solid"
        mb={4} // Add margin bottom to space between buttons
        onClick={() => navigate('/contactus')}
      >
        {t('contactus')}
      </Button>

      <Button
        leftIcon={<InfoIcon />}
        colorScheme="teal"
        width="100%"
        size="lg"
        variant="outline" // Keep outline for differentiation
        onClick={() => navigate("/about")} // Your onClick function
      >
        {t('about')} {/* Button text */}
      </Button>
    </Box>
      </Box>
      
    </Layout>
  );
};

export default Profile;
