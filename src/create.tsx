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
  Switch,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import Layout from './Layout';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';

const CreateAd: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minCount, setMinCount] = useState(0);
  const [maxCount, setMaxCount] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertStatus, setAlertStatus] = useState<'error' | 'success' | 'warning' | 'info' | ''>('');
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ first_name: string; last_name: string; instagram_account: string } | null>(null); // New state for user data
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
    }
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      const userId = Cookies.get('userId');

      const response = await fetch(`${process.env.REACT_APP_API}users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      const userData = await response.json();
      setUserData(userData); // Store user data in state
      setInfo(userData.info); // Assuming the user object has info property
    } catch (error) {
      console.error('Error fetching user data', error);
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
    if (showName) constructedInfo += userData.first_name; // Include first name if toggle is on
    if (showLastName) constructedInfo += ` ${userData.last_name}`; // Append last name
    if (showInstagramAccount) constructedInfo += ` Instagram: ${userData.instagram_account}`; // Append Instagram account
    
    const requestData = {
      title,
      description,
      min: parseInt(minCount.toString(), 10),
      max: parseInt(maxCount.toString(), 10),
      date,
      time,
      userId,
      emailAlerts,
      info: constructedInfo.trim() || null, // Only include if constructedInfo is not empty
      autoreserve, // Add this line for autoreserve
    };
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API}ads/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
  
      const result = await response.json();
      if (response.ok) {
        setAlertStatus('success');
        setTitle('');
        setDescription('');
        setMinCount(0);
        setMaxCount(0);
        setDate(null);
        setTime(null);
        setEmailAlerts(false);
        setShowName(false);
        setShowLastName(false); // Reset show last name toggle
        setShowInstagramAccount(false); // Reset show Instagram account toggle
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
      onClose();
      window.scrollTo({ top: 0, behavior: 'smooth' });

    }
  };
  

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Layout>
      <Box maxW="500px" mx="auto" mt={8} p={6} boxShadow="lg" borderRadius="md" bg="white">
        <Heading mb={6} textAlign="center" fontSize="2xl" color="teal.600">
          {t('createAd')}
        </Heading>

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
                focusBorderColor="teal.500"
              />
            </FormControl>

            <FormControl id="description" isRequired>
              <FormLabel>{t('description')}</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description')}
                focusBorderColor="teal.500"
              />
            </FormControl>

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

            <FormControl id="date" isRequired>
              <FormLabel>{t('date')}</FormLabel>
              <Input
                type="date"
                value={date || ''}
                onChange={handleDateChange}
                focusBorderColor="teal.500"
              />
            </FormControl>

            <FormControl id="time" isRequired>
              <FormLabel>{t('time')}</FormLabel>
              <Input
                type="time"
                value={time || ''}
                onChange={(e) => setTime(e.target.value)}
                focusBorderColor="teal.500"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="showname" mb="0">
                {t('showname')}
              </FormLabel>
              <Switch
                id="showname"
                isChecked={showName}
                onChange={(e) => setShowName(e.target.checked)}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="showlastname" mb="0">
                {t('showlastname')}
              </FormLabel>
              <Switch
                id="showlastname"
                isChecked={showLastName}
                onChange={(e) => setShowLastName(e.target.checked)}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="showinstagram" mb="0">
                {t('showinstagram')}
              </FormLabel>
              <Switch
                id="showinstagram"
                isChecked={showInstagramAccount}
                onChange={(e) => setShowInstagramAccount(e.target.checked)}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="autoreserve" mb="0">
                {t('autoreserve')}
              </FormLabel>
              <Switch
                id="autoreserve"
                isChecked={autoreserve}
                onChange={(e) => setAutoReserve(e.target.checked)}
              />
            </FormControl>
            <Button type="submit" isLoading={isSubmitting} colorScheme="teal" width="full">
              {t('submit')}
            </Button>
          </VStack>
        </form>
      </Box>

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
