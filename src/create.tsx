import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Select, // Import Select for language selection
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import Layout from './Layout'; // Import the Layout component
import Cookies from 'js-cookie'; // Import Cookies for userId management
import { useTranslation } from 'react-i18next'; // Import useTranslation

const CreateAd: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // Use the useTranslation hook
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minCount, setMinCount] = useState(0);
  const [maxCount, setMaxCount] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertStatus, setAlertStatus] = useState<'error' | 'success' | 'warning' | 'info' | ''>('');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null); // Ensure it's a valid ref

  // Set the initial date to one day from today
  useEffect(() => {
    const userId = Cookies.get('userId');
    if (!userId) {
      navigate('/signup'); // Redirect to signup if userId is not available
    }
  }, [navigate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the start of the day

    // Set date state
    setDate(e.target.value);

    // Check if the selected date is today or before today
    if (selectedDate <= today) {
      toast({
        title: t('invalidInput'),
        description: t('invalidInput'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      // Reset date and time to null
      setDate(null);
      setTime(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onOpen(); // Open the confirmation dialog instead of submitting directly
  };

  const confirmSubmission = async () => {
    setIsSubmitting(true);

    // Perform validation before submitting
    if (!date || !time || minCount <= 0 || (maxCount < minCount && maxCount!=0)) {
      toast({
        title: t('invalidInput'),
        description: t('invalidInput'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return; // Stop submission if any validation fails
    }

    const userId = Cookies.get('userId'); // Get the userId from cookies
    const requestData = {
      title,
      description,
      min: parseInt(minCount.toString(), 10), // Ensure min is an integer
      max: parseInt(maxCount.toString(), 10), // Ensure max is an integer
      date,
      time,
      userId,
    };

    try {
      const response = await fetch(process.env.REACT_APP_API + 'ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Set content type to JSON
        },
        body: JSON.stringify(requestData), // Stringify the request data
      });

      const result = await response.json();
      if (response.ok) {
        // Handle successful response
        setAlertStatus('success');
        setTitle('');
        setDescription('');
        setMinCount(0); // Reset Min count
        setMaxCount(0); // Reset Max count
        setDate(null); // Reset date to null
        setTime(null); // Reset time to null
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
      console.error('Error creating ad', error);
      setAlertStatus('error');
    } finally {
      setIsSubmitting(false);
      onClose(); // Close dialog after action
    }
  };

  // Function to handle language change
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Layout>
      <Box maxW="500px" mx="auto" mt={8} p={6} boxShadow="lg" borderRadius="md" bg="white">
        <Heading mb={6} textAlign="center" fontSize="2xl" color="teal.600">
          {t('createAd')}
        </Heading>

     

        {/* Alert Messages */}
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
            {/* Title Field */}
            <FormControl id="title" isRequired>
              <FormLabel>{t('title')}</FormLabel>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('title')}
                focusBorderColor="teal.500"
              />
            </FormControl>

            {/* Description Field */}
            <FormControl id="description" isRequired>
              <FormLabel>{t('description')}</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description')}
                focusBorderColor="teal.500"
              />
            </FormControl>

            {/* Min and Max Fields */}
            <VStack spacing={4} align="start" width="100%">
              <HStack justify="space-between" width="100%">
                <FormLabel>{t('min')}</FormLabel>
                <HStack>
                  <IconButton
                    aria-label="Decrease Min"
                    icon={<MinusIcon />}
                    onClick={() => setMinCount(minCount > 0 ? minCount - 1 : 0)}
                    size="sm"
                    colorScheme="teal"
                  />
                  <Text>{minCount}</Text>
                  <IconButton
                    aria-label="Increase Min"
                    icon={<AddIcon />}
                    onClick={() => setMinCount(minCount + 1)}
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
                    onClick={() => setMaxCount(maxCount > 0 ? maxCount - 1 : 0)}
                    size="sm"
                    colorScheme="teal"
                  />
                  <Text>{maxCount}</Text>
                  <IconButton
                    aria-label="Increase Max"
                    icon={<AddIcon />}
                    onClick={() => setMaxCount(maxCount + 1)}
                    size="sm"
                    colorScheme="teal"
                  />
                </HStack>
              </HStack>
            </VStack>

            {/* Date Field */}
            <FormControl id="date" isRequired>
              <FormLabel>{t('date')}</FormLabel>
              <Input
                type="date"
                value={date || ''}
                onChange={handleDateChange}
                focusBorderColor="teal.500"
              />
            </FormControl>

            {/* Time Field */}
            <FormControl id="time" isRequired>
              <FormLabel>{t('time')}</FormLabel>
              <Input
                type="time"
                value={time || ''}
                onChange={(e) => setTime(e.target.value)}
                focusBorderColor="teal.500"
              />
            </FormControl>

            {/* Submit Button */}
            <Button type="submit" isLoading={isSubmitting} colorScheme="teal" width="full">
              {t('submit')}
            </Button>
          </VStack>
        </form>
      </Box>

      {/* Confirmation Dialog */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('confirmSubmission')}
            </AlertDialogHeader>
            <AlertDialogBody>
              {t('confirmSubmissionMessage')}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button colorScheme="teal" onClick={confirmSubmission} ml={3}>
                {t('confirm')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
};

export default CreateAd;
