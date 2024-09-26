// AdDetail.tsx
import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Spinner, useToast, Progress, Button, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, AlertDialogCloseButton, useDisclosure } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie'; // Import Cookies to manage user cookies
import Layout from './Layout'; // Adjust the import path as necessary

interface Ad {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  min: number;
  max: number;
  available: number;
}

const AdDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get the ad id from the URL parameters
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  
  // Alert Dialog state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null); // Use for cancel button reference

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

  // Function to calculate progress percentage
  const calculateProgress = (min: number, max: number, available: number) => {
    if (max - available <= 0) return 100; // Full progress if max equals available
    const progress = ((max - available) / min) * 100; // Calculate percentage
    return Math.min(progress, 100); // Cap the value at 100%
  };

  const calculatePeopleNeeded = (min: number, max: number, available: number) => {
    const needed = min - (max - available);
    return needed > 0 ? needed : 0; // Ensure we don't display negative numbers
  };

  // Handle button click
  const handleButtonClick = async () => {
    // Show the alert dialog
    onOpen();
  };

  const handleConfirm = async () => {
    const userId = Cookies.get('userId'); // Get user ID from cookies
    if (!userId || !ad) return; // Safety check

    // Update the available count and insert a request
    try {
      const response = await fetch(`${process.env.REACT_APP_API}requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id: ad.id,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create request');
      }

      // Update available count
      setAd(prevAd => (prevAd ? { ...prevAd, available: prevAd.available - 1 } : prevAd));

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
      onClose(); // Close the dialog
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
            <Button 
              colorScheme="teal" 
              onClick={handleButtonClick} 
              mb={4} // Margin bottom for spacing
            >
              I Want to Go
            </Button>
            <Text mb={4}>{ad.description}</Text>
            <Text color="gray.500">
              Date: {new Date(ad.date).toLocaleDateString()} {ad.time}
            </Text>
            <Box mt={4}>
              <Text fontWeight="bold">Progress:</Text>
              <Progress 
                hasStripe 
                value={calculateProgress(ad.min, ad.max, ad.available)} 
                colorScheme="teal" 
              />
              <Text mt={2}>
                {calculatePeopleNeeded(ad.min, ad.max, ad.available)} people needed to reach the minimum number for this event.
              </Text>
            </Box>

            {/* Alert Dialog for confirmation */}
            <AlertDialog
              motionPreset='slideInBottom'
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
                  <Button colorScheme='teal' ml={3} onClick={handleConfirm}>
                    Yes
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <Text>No ad details found.</Text>
        )}
      </Box>
    </Layout>
  );
};

export default AdDetail;
