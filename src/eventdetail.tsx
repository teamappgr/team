import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  useToast,
  Progress,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import Layout from './Layout';

interface Ad {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  min: number;
  max: number;
  available: number;
  info?: string;
}

const AdDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchAdDetail = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}ads/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch ad detail');
        }
        const data = await response.json();
        setAd(data);
      } catch (error) {
        toast({
          title: 'Error fetching ad details',
          description: 'Unable to fetch ad details. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdDetail();
  }, [id, toast]);

  const calculateProgress = (min: number, max: number, available: number) => {
    if (max === available) return 0;
    if (max - available < 0) return 100;
    const progress = ((max - available) / min) * 100;
    return Math.min(progress, 100);
  };

  const calculatePeopleNeeded = (min: number, max: number, available: number) => {
    const needed = min - (max - available);
    return needed > 0 ? needed : 0;
  };

  const getLastAvailablePositions = (min: number, max: number, available: number) => {
    return min - (max - available) <= 0 ? available : null;
  };

  const handleButtonClick = () => onOpen();

  const handleConfirm = async () => {
    const userId = Cookies.get('userId');
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to express your interest.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const userResponse = await fetch(`${process.env.REACT_APP_API}profile/${userId}`);
      const userData = await userResponse.json();

      if (!userData || !userData.verified) {
        toast({
          title: 'Error',
          description: 'Your account is not verified. Please verify your account before proceeding.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API}requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ad_id: ad?.id, user_id: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create request');
      }

      toast({
        title: 'Success!',
        description: 'You have expressed your interest in attending this event.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to express your interest. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
    }
  };
// Utility function to convert the Base64 VAPID public key to a Uint8Array
const urlB64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

  const handleSubscribe = async () => {
    console.log('Attempting to subscribe...');

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            // Register the service worker
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered:', registration);

            // Check if push manager is available and service worker is active
            if (registration.active && registration.pushManager) {
                // Get existing subscriptions
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
                const newSubscription = await registration.pushManager.subscribe({
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
                        userId: Cookies.get('userId'),
                        endpoint: newSubscription.endpoint,
                        keys: newSubscription.toJSON().keys, // Make sure keys are sent as JSON
                    }),
                });

                // Handle the response from the backend
                if (!response.ok) {
                    const errorMessage = await response.json();
                    console.error('Failed to subscribe:', errorMessage);
                } else {
                    console.log('Subscription successful!');
                }
            } else {
                console.error('Service Worker is not active or Push Manager is unavailable.');
            }
        } catch (error) {
            console.error('Subscription error:', error);
        }
    } else {
        console.error('Service workers or Push notifications are not supported in this browser.');
    }
};


  return (
    <Layout>
      <Box maxW="800px" mx="auto" p={6}>
        {loading ? (
          <Spinner size="xl" />
        ) : ad ? (
          <>
            <Heading mb={4}>{ad.title}</Heading>
            <Text mb={4}>{ad.description}</Text>
            {ad.info && (
              <Text mb={4} fontStyle="italic" color="gray.600">
                From: {ad.info}
              </Text>
            )}
            <Text color="gray.500">
              Date: {new Date(ad.date).toLocaleDateString()} {ad.time}
            </Text>
            <Box mt={4}>
              <Text fontWeight="bold">Progress:</Text>
              <Progress hasStripe value={calculateProgress(ad.min, ad.max, ad.available)} colorScheme="teal" />
              <Text mt={2}>
                {calculatePeopleNeeded(ad.min, ad.max, ad.available)} people needed to reach the minimum number for this event.
              </Text>
              {getLastAvailablePositions(ad.min, ad.max, ad.available) !== null && (
                <Text mt={2} color="red.500">
                  Last available positions: {getLastAvailablePositions(ad.min, ad.max, ad.available)}
                </Text>
              )}
            </Box>

            <AlertDialog
              motionPreset="slideInBottom"
              leastDestructiveRef={cancelRef}
              onClose={onClose}
              isOpen={isOpen}
              isCentered
            >
              <AlertDialogOverlay />
              <AlertDialogContent>
                <AlertDialogHeader>Confirm Your Attendance</AlertDialogHeader>
                <AlertDialogCloseButton />
                <AlertDialogBody>
                  Are you sure you want to express your interest in this event?
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onClose}>
                    No
                  </Button>
                  <Button colorScheme="teal" ml={3} onClick={handleConfirm}>
                    Yes
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <Text>No ad details found.</Text>
        )}
        {ad && ad.available > 0 && (
          <Button colorScheme="teal" onClick={handleButtonClick} mb={4}>
            I Want to Go
          </Button>
        )}
        <Button colorScheme="teal" onClick={handleSubscribe}>
          Subscribe for Notifications
        </Button>
      </Box>
    </Layout>
  );
};



export default AdDetail;
