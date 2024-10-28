import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  VStack,
  Heading,
  useToast,
  Stack,
  Alert,
  AlertIcon,
  HStack,
  IconButton,
  Text,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogCloseButton,
  useDisclosure,
  Switch,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon,ArrowBackIcon } from '@chakra-ui/icons';
import Layout from './Layout';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';

const EventEdit: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const adId = location.state?.adId; // Access the adId passed from the previous component

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minCount, setMinCount] = useState(0);
  const [maxCount, setMaxCount] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [available, setavailable] = useState<number>(minCount); // Initialize as number

  const [time, setTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertStatus, setAlertStatus] = useState<'error' | 'success' | 'warning' | 'info' | ''>('');
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ first_name: string; last_name: string; instagram_account: string } | null>(null);
  const [showName, setShowName] = useState(false);
  const [showLastName, setShowLastName] = useState(false);
  const [showInstagramAccount, setShowInstagramAccount] = useState(false);
  const [autoreserve, setAutoReserve] = useState(true);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Fetch the user's first name and last name on mount
  useEffect(() => {
    const userId = Cookies.get('userId');
    if (!userId) {
      navigate('/signup');
    } else {
      fetchUserData(userId);
      if (adId) {
        fetchAdData(adId); // Fetch the ad data when adId is available
      }
    }
  }, [navigate, adId]);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API}users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      const userData = await response.json();
      setUserData(userData);
      setInfo(userData.info);
    } catch (error) {
      console.error('Error fetching user data', error);
    }
  };

  const fetchAdData = async (adId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API}ads/${adId}`); // Adjust this URL as per your API
      if (!response.ok) throw new Error('Failed to fetch ad data');
      const adData = await response.json();
      
      // Assuming adData has the same structure as your form state
      setTitle(adData.title);
      setDescription(adData.description);
      setMinCount(adData.min);
      setMaxCount(adData.max);
      const adDate = new Date(adData.date); // Assuming adData.date is in ISO format
      const formattedDate = adDate.toISOString().split('T')[0]; // This will give you YYYY-MM-DD
      setDate(formattedDate);
      setavailable(adData.available);
      // Handle time if available
      const formattedTime = adDate.toTimeString().split(' ')[0].substring(0, 5); // Get HH:mm
      setTime(formattedTime);      setTime(adData.time);
      setEmailAlerts(adData.emailAlerts);
      setShowName(adData.showName);
      setShowLastName(adData.showLastName);
      setShowInstagramAccount(adData.showInstagramAccount);
      setAutoReserve(adData.autoreserve);
    } catch (error) {
      console.error('Error fetching ad data', error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setDate(e.target.value);

    if (selectedDate <= today) {
      toast({
        title: t('invalidInput'),
        description: t('invalidInput'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setDate(null);
      setTime(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onOpen();
  };

  const confirmSubmission = async () => {
    setIsSubmitting(true);

    if (!date || !time || minCount <= 0 || (maxCount < minCount && maxCount !== 0)) {
      toast({
        title: t('invalidInput'),
        description: t('invalidInput'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    const userId = Cookies.get('userId');

    if (!userData) {
      toast({
        title: t('userDataError'),
        description: t('userDataError'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    // Construct the info string based on the toggles
    let constructedInfo = '';
    if (showName) constructedInfo += userData.first_name;
    if (showLastName) constructedInfo += ` ${userData.last_name}`;
    if (showInstagramAccount) constructedInfo += ` Instagram: ${userData.instagram_account}`;
    
    const requestData = {
      title,
      description,
      min: parseInt(minCount.toString(), 10),
      max: parseInt(maxCount.toString(), 10),
      date,
      available,
      time,
      userId,
      emailAlerts,
      info: constructedInfo.trim() || null,
      autoreserve,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API}ads2/${adId}`, {
        method: 'PUT', // Use PUT for update
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      if (response.ok) {
        setAlertStatus('success');
        // Optionally, you may want to redirect or reset the form
      } else {
        if (result.message === 'Your account is not verified.') {
          toast({
            title: t('accountNotVerified'),
            description: t('accountNotVerified'),
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        setAlertStatus('error');
      }
    } catch (error) {
      console.error('Error updating ad', error);
      setAlertStatus('error');
    } finally {
      setIsSubmitting(false);
      onClose();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Layout>
      <Box p={5}>
      <Box display="flex" alignItems="center" mb={6}>
          <IconButton
            icon={<ArrowBackIcon />}
            aria-label="Go back to profile"
            onClick={() => navigate(-1)} // Redirect to profile page
            variant="outline" // Optional styling
            colorScheme="teal" // Optional styling
            mr={4} // Add margin to the right for spacing
          />
          <Heading  color="teal.600">{t('editevent')}</Heading>
        </Box>

        <Stack spacing={3} mb={4}>
          {alertStatus === 'error' && (
            <Alert status="error">
              <AlertIcon />
              {t('createAdError')}
            </Alert>
          )}
          {alertStatus === 'success' && (
            <Alert status="success">
              <AlertIcon />
              {t('createAdSuccess')}
            </Alert>
          )}
          {alertStatus === 'info' && (
            <Alert status="info">
              <AlertIcon />
              {t('missingFields')}
            </Alert>
          )}
          {alertStatus === 'warning' && (
            <Alert status="warning">
              <AlertIcon />
              {t('warningMessage')}
            </Alert>
          )}
        </Stack>

        <form onSubmit={handleSubmit}>
          <VStack spacing={5}>
            <FormControl id="title" isRequired>
              <FormLabel>{t('title')}</FormLabel>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('title')}
                focusBorderColor="teal.400"
                bg="gray.100"
              />
            </FormControl>

            <FormControl id="description" isRequired>
              <FormLabel>{t('description')}</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description')}
                focusBorderColor="teal.400"
                bg="gray.100"
              />
            </FormControl>
            <VStack spacing={4} align="start" width="100%">
  {/* Min Count Section */}
  <HStack justify="space-between" width="100%">
    <FormLabel>{t('min')}</FormLabel>
    <HStack>
      <IconButton
        aria-label="Decrease Min"
        icon={<MinusIcon />}
        onClick={() => setMinCount(prevMin => Math.max(0, prevMin - 1))} // Prevent minCount from going below 0
        size="sm"
        colorScheme="teal"
      />
      <Text>{minCount}</Text>
      <IconButton
        aria-label="Increase Min"
        icon={<AddIcon />}
        onClick={() => {
          setMinCount(prevMin => {
            const newMin = Number(prevMin) + 1; // Ensure we treat it as a number
            setMaxCount(prevMax => {
              // Ensure maxCount is adjusted if it's less than the new minCount
              return Math.max(Number(prevMax), newMin);
            });
            console.log("Increased Min Count:", newMin); // Log the new min count
            return newMin; // Return the new value of minCount
          });
        }}
        size="sm"
        colorScheme="teal"
      />
    </HStack>
  </HStack>
  <HStack justify="space-between" width="100%">
  <FormLabel>{t('max')}</FormLabel>
  <HStack>
    <IconButton
      aria-label="Decrease Max"
      icon={<MinusIcon />}
      onClick={() => {
        setMaxCount(prevMax => {
          const newMax = Math.max(prevMax - 1, minCount);
          if (newMax < maxCount) {
            setavailable(prevAvailable => Math.max(prevAvailable - 1, 0)); // Decrease available separately
          }
          return newMax;
        });
      }}
      size="sm"
      colorScheme="teal"
      isDisabled={available === 0} // Disable button if available is 0
    />
    <Text>{maxCount}</Text>
    <IconButton
      aria-label="Increase Max"
      icon={<AddIcon />}
      onClick={() => {
        setMaxCount(prevMax => {
          const newMax = Number(prevMax) + 1;
          setavailable(prevAvailable => Math.min(prevAvailable + 1, newMax)); // Increase available separately
          return newMax;
        });
      }}
      size="sm"
      colorScheme="teal"
    />
  </HStack>
</HStack>

<Box mb={2}></Box> {/* Line break added here */}

<HStack justify="space-between" width="100%">
  <FormLabel>{t('available')}</FormLabel>
  <HStack>
    <Text>{available}</Text> {/* Display available */}
  </HStack>
</HStack>

<Box mb={2}></Box> {/* Line break added here */}

<HStack justify="space-between" width="100%">
  <FormLabel>{t('available')}</FormLabel>
  <HStack>
    <Text>{available}</Text> {/* Display available */}
  </HStack>
</HStack>

</VStack>


            <FormControl id="date" isRequired>
              <FormLabel>{t('date')}</FormLabel>
              <Input
                type="date"
                value={date || ''}
                onChange={handleDateChange}
                focusBorderColor="teal.400"
                bg="gray.100"
              />
            </FormControl>

            <FormControl id="time" isRequired>
              <FormLabel>{t('time')}</FormLabel>
              <Input
                type="time"
                value={time || ''}
                onChange={(e) => setTime(e.target.value)}
                focusBorderColor="teal.400"
                bg="gray.100"
              />
            </FormControl>



            <Button type="submit" colorScheme="teal" isLoading={isSubmitting}>
              {t('saveChanges')}
            </Button>
          </VStack>
        </form>
      </Box>

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        onClose={onClose}
        leastDestructiveRef={cancelRef}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('confirmSubmission')}
            </AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              {t('confirmSubmissionMessage')}
            </AlertDialogBody>
            <AlertDialogFooter>
              <HStack>
                <Button ref={cancelRef} onClick={onClose}>
                  {t('cancel')}
                </Button>
                <Button colorScheme="teal" onClick={confirmSubmission} isLoading={isSubmitting}>
                  {t('confirm')}
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
};

export default EventEdit;
