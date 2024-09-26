import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Button,
  useToast,
  AlertDialog,
  Avatar,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogFooter,
} from '@chakra-ui/react';
import Cookies from 'js-cookie';
import Layout from './Layout';

interface User {
  first_name: string;
  last_name: string;
  instagram_account: string;
  gender: string;
  requestId: number; // For tracking the request
  answer: number; // Status of acceptance (0 for rejected, 1 for accepted, 2 for pending)
}

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
  requests?: User[];
}

const MyEvents: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  
  // Alert dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ requestId: number; adId: number; action: 'accept' | 'reject' } | null>(null);
  
  const cancelRef = useRef<HTMLButtonElement>(null); // Ref for the cancel button

  const onOpen = (requestId: number, adId: number, action: 'accept' | 'reject') => {
    setSelectedRequest({ requestId, adId, action });
    setIsOpen(true);
  };
  
  const onClose = () => {
    setIsOpen(false);
    setSelectedRequest(null);
  };

  const handleConfirm = async () => {
    if (!selectedRequest) return;

    const { requestId, adId, action } = selectedRequest;
    
    try {
      const response = await fetch(`/requests/${requestId}/${action}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`Failed to ${action} request`);

      // Update local state
      setAds((prevAds) =>
        prevAds.map((ad) => {
          if (ad.id === adId) {
            return {
              ...ad,
              available: action === 'accept' ? ad.available - 1 : ad.available,
              requests: ad.requests?.map(req => 
                req.requestId === requestId ? { ...req, answer: action === 'accept' ? 1 : 0 } : req // Update answer
              ),
            };
          }
          return ad;
        })
      );

      toast({
        title: 'Success',
        description: `Request ${action}ed successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: "error.message",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose(); // Close the dialog after confirming
    }
  };

  useEffect(() => {
    const fetchMyEvents = async () => {
      const userId = Cookies.get('userId');

      if (!userId) {
        toast({
          title: 'Error',
          description: 'User ID not found. Please log in again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API}ads?user_id=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch ads');
        }
        const adsData = await response.json();

        // Fetch requests for each ad
        const adsWithRequests = await Promise.all(
          adsData.map(async (ad: Ad) => {
            const requestsResponse = await fetch(`${process.env.REACT_APP_API}ads/${ad.id}/requests`);
            const requestsData = await requestsResponse.json();
            return { ...ad, requests: requestsData }; // Attach requests to the ad
          })
        );

        setAds(adsWithRequests);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch your events. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [toast]);

  return (
    <Layout>
      <Box maxW="800px" mx="auto" p={6}>
        {loading ? (
          <Spinner size="xl" />
        ) : ads.length > 0 ? (
          ads.map((ad) => (
            <Box key={ad.id} borderWidth="1px" borderRadius="lg" p={4} mb={4}>
              <Heading size="md" mb={2}>{ad.title}</Heading>
              <Text mb={2}>{ad.description}</Text>
              <Text color="gray.500">
                Date: {new Date(ad.date).toLocaleDateString()} {ad.time}
              </Text>
              <Text color="gray.500">Available: {ad.available}</Text>
              {ad.requests && ad.requests.length > 0 ? (
  ad.requests.map((user: User) => (
    <Box key={user.requestId} borderWidth="1px" borderRadius="lg" p={2} mt={2}>
      <Text><strong>Name:</strong> {user.first_name} {user.last_name}</Text>
      <Text><strong>Instagram:</strong> {user.instagram_account}</Text>
      <Box display="flex" alignItems="center">
        <Avatar
          size="sm"
          name={user.gender === 'male' ? 'Male' : 'Female'}
          src={user.gender === 'male' 
            ? 'https://static.vecteezy.com/system/resources/previews/001/840/612/non_2x/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg' 
            : 'https://i.pinimg.com/736x/1b/2e/31/1b2e314e767a957a44ed8f992c6d9098.jpg'} // Female Avatar
          ml={2}
        />
      </Box>
      <Box mt={2}>
        {user.answer === 2 ? (
          <>
            <Button 
              colorScheme="green" 
              onClick={() => onOpen(user.requestId, ad.id, 'accept')} 
              isDisabled={ad.available <= 0}
            >
              Accept
            </Button>
            <Button 
              colorScheme="red" 
              onClick={() => onOpen(user.requestId, ad.id, 'reject')} 
              ml={2}
            >
              Reject
            </Button>
          </>
        ) : (
          <Text 
            fontWeight="bold" 
            color={user.answer === 1 ? 'green.500' : 'red.500'}
          >
            {user.answer === 1 ? 'Accepted' : 'Rejected'}
          </Text>
        )}
      </Box>
    </Box>
  ))
) : (
  <Text>No requests found for this event.</Text>
)}

              {ad.info && (
                <Text mb={4} fontStyle="italic" color="gray.600">
                  From: {ad.info}
                </Text>
              )}
            </Box>
          ))
        ) : (
          <Text>No events found for you.</Text>
        )}

        {/* Alert Dialog */}
        <AlertDialog
          motionPreset='slideInBottom'
          leastDestructiveRef={cancelRef}
          onClose={onClose}
          isOpen={isOpen}
          isCentered
        >
          <AlertDialogOverlay />

          <AlertDialogContent>
            <AlertDialogHeader>Confirm Action</AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              Are you sure you want to {selectedRequest?.action} this request?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                No
              </Button>
              <Button colorScheme='red' ml={3} onClick={handleConfirm}>
                Yes
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Box>
    </Layout>
  );
};

export default MyEvents;
