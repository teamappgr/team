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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import Cookies from 'js-cookie';
import Layout from './Layout';
import { useTranslation } from 'react-i18next';

interface User {
  requestid: number;
  first_name: string;
  last_name: string;
  instagram_account: string;
  gender: string;
  answer: number;
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
  verified: boolean | null; // Updated to include the 'verified' field

}
interface Request {
  id: number;
  user_id: number; // This may be redundant if you only fetch by userId
  ad_id: number; // Foreign key to ads table
  answer: number; // 0 for rejected, 1 for accepted, 2 for pending
  ad: Ad; // Include the ad details
}
const MyEvents: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { t } = useTranslation();
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ requestId: number; adId: number; action: 'accept' | 'reject' } | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const onOpen = (requestId: number, adId: number, action: 'accept' | 'reject') => {
    console.log(`Opening dialog with requestId: ${requestId}, adId: ${adId}, action: ${action}`);
    setSelectedRequest({ requestId, adId, action });
    setIsOpen(true);
  };
  
  const onDeleteOpen = (adId: number) => {
    setSelectedAdId(adId);
    setIsDeleteOpen(true);
  };

  const onDeleteClose = () => {
    setIsDeleteOpen(false);
    setSelectedAdId(null);
  };

  const handleDelete = async () => {
    if (selectedAdId === null) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API}ads/${selectedAdId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete ad');

      setAds(ads.filter(ad => ad.id !== selectedAdId));

      toast({
        title: 'Success',
        description: 'Ad deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: "Failed to delete ad.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };

  const onClose = () => {
    setIsOpen(false);
    setSelectedRequest(null);
  };
  
  
  const handleConfirm = async () => {
    if (!selectedRequest) return;
  
    const { requestId, adId, action } = selectedRequest;
    console.log(`Confirming action: ${action} for requestId: ${requestId}, adId: ${adId}`);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API}requests/${requestId}/${action}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`Failed to ${action} request`);
  
      setAds((prevAds) =>
        prevAds.map((ad) => {
          if (ad.id === adId) {
            return {
              ...ad,
              available: action === 'accept' ? ad.available - 1 : ad.available,
              requests: ad.requests?.map(req => 
                req.requestid === requestId ? { ...req, answer: action === 'accept' ? 1 : 0 } : req
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
      onClose();
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
        const response = await fetch(`${process.env.REACT_APP_API}ads1/${userId}`, {
          method: 'GET',
          credentials: 'include', // Include cookies with request
        });
        if (!response.ok) {
          throw new Error('Failed to fetch ads');
        }
        const adsData = await response.json();

        const adsWithRequests = await Promise.all(
          adsData.map(async (ad: Ad) => {
            const requestsResponse = await fetch(`${process.env.REACT_APP_API}ads/${ad.id}/requests`);
            const requestsData = await requestsResponse.json();
            return { ...ad, requests: requestsData };
          })
        );

        setAds(adsWithRequests);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };
    const fetchRequests = async () => {
      const userId = Cookies.get('userId');
      try {
        const response = await fetch(`${process.env.REACT_APP_API}api/requests/${userId}`, {
          method: 'GET',
          credentials: 'include', // Include cookies with request
        });
        const data = await response.json();
  
        // Ensure that the fetched data is an array
        if (Array.isArray(data)) {
          setRequests(data);
        } else {
          setRequests([]); // Set an empty array if the fetched data is not an array
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
        setRequests([]); // Ensure it's always an array, even in case of error
      }
    };
  
    fetchRequests();
    fetchMyEvents();
  }, [toast],);
  const handleDeleteRequest = async (requestId: number) => {
    const userId = Cookies.get('userId');

    try {
      const response = await fetch(`${process.env.REACT_APP_API}api/requests/${requestId}/${userId}`, {
        method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      });
      
      if (response.ok) {
        // Remove the deleted request from the state
        setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
        toast({
          title: t('success'), // Use translation for the success title
          description: t('requestDeleted'), // Provide translation for successful deletion
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Handle error response
        const errorMessage = await response.text();
        console.error('Error deleting request:', errorMessage);
        toast({
          title: t('error'),
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };
  
  return (
<Layout>
    <Box maxW="800px" mx="auto" p={6}>
        <Heading mb={6} textAlign="center" color="teal.600">
            {t('showmyevents')}
        </Heading>
        {loading ? (
            <Spinner size="xl" />
        ) : (
            <Accordion allowMultiple>
                {/* Existing Upcoming Events Section */}
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box as='span' flex='1' textAlign='left'>
                                {t('upcoming')}
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        {ads.filter(ad => new Date(ad.date) >= new Date()).map(ad => (
                            <Box key={ad.id} borderWidth="1px" borderRadius="lg" p={4} mb={4}>
                                <Heading size="md" mb={2}>{ad.title}</Heading>
                                <Text mb={2}>{ad.description}</Text>
                                <Text color="gray.500">
                                    {t('date')}: {new Date(ad.date).toLocaleDateString()} {ad.time}
                                </Text>
                                <Text color="gray.500">{t('availability')}: {ad.available}</Text>
                                <Text 
                                    fontWeight="bold" 
                                    color={
                                        ad.verified === true ? 'green.500' : 
                                        ad.verified === false ? 'red.500' : 
                                        'yellow.500'
                                    }
                                >
                                    {ad.verified === true ? t('accepted') : 
                                     ad.verified === false ? t('rejected') : 
                                     'Pending'}
                                </Text>
                                {ad.requests && ad.requests.length > 0 ? (
                                    ad.requests.map((user: User) => (
                                        <Box key={user.requestid} borderWidth="1px" borderRadius="lg" p={2} mt={2}>
                                                                                          <Avatar
                                                    size="sm"
                                                    name={user.gender === 'male' ? 'Male' : 'Female'}
                                                    src={user.gender === 'male' 
                                                        ? 'https://static.vecteezy.com/system/resources/previews/001/840/612/non_2x/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg' 
                                                        : 'https://i.pinimg.com/736x/1b/2e/31/1b2e314e767a957a44ed8f992c6d9098.jpg'}
                                                    ml={2}
                                                />
                                            <Text><strong>{t('firstName')}:</strong> {user.first_name}<strong> {t('lastName')}:</strong>{user.last_name}</Text>
                                            <Text><strong>Instagram:</strong> {user.instagram_account}</Text>
                                            <Box display="flex" alignItems="center">

                                            </Box>
                                            <Box mt={2}>
                                                {user.answer === 2 || user.answer === 1 ? (
                                                    <>
                                                        <Button 
                                                            colorScheme="green" 
                                                            onClick={() => {
                                                                console.log("User object:", user);
                                                                onOpen(user.requestid, ad.id, 'accept');
                                                            }}
                                                            isDisabled={ad.available <= 0 || user.answer === 1}
                                                        >
                                                            {t('accept')}
                                                        </Button>
                                                        <Button 
                                                            colorScheme="red" 
                                                            onClick={() => {
                                                                console.log("User object for reject:", user);
                                                                onOpen(user.requestid, ad.id, 'reject');
                                                            }}
                                                            ml={2}
                                                        >
                                                            {t('reject')}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Text 
                                                        fontWeight="bold" 
                                                        color={user.answer === 1 ? 'green.500' : 'red.500'}
                                                    >
                                                        {user.answer === 1 ? t('accept') : t('rejected')}
                                                    </Text>
                                                )}
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Text>{t('norequests')}</Text>
                                )}
                                <Button 
                                    colorScheme="red" 
                                    onClick={() => onDeleteOpen(ad.id)} 
                                    mt={4}
                                >
                                    {t('delete')}
                                </Button>
                            </Box>
                        ))}
                    </AccordionPanel>
                </AccordionItem>

                {/* Existing Past Events Section */}
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box as='span' flex='1' textAlign='left'>
                                {t('past')}
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        {ads.filter(ad => new Date(ad.date) < new Date()).map(ad => (
                            <Box key={ad.id} borderWidth="1px" borderRadius="lg" p={4} mb={4}>
                                <Heading size="md" mb={2}>{ad.title}</Heading>
                                <Text mb={2}>{ad.description}</Text>
                                <Text color="gray.500">
                                    {t('date')}: {new Date(ad.date).toLocaleDateString()} {ad.time}
                                </Text>
                                <Text color="gray.500">{t('availability')}: {ad.available}</Text>
                                <Text 
                                    fontWeight="bold" 
                                    color={
                                        ad.verified === true ? 'green.500' : 
                                        ad.verified === false ? 'red.500' : 
                                        'yellow.500'
                                    }
                                >
                                    {ad.verified === true ? 'Accepted' : 
                                     ad.verified === false ? 'Rejected' : 
                                     t('pending')}
                                </Text>
                            </Box>
                        ))}
                    </AccordionPanel>
                </AccordionItem>

                {/* My Requests Section */}
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box as='span' flex='1' textAlign='left'>
                            {t('myrequests')}
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        {requests.map(request => (
                            <Box key={request.id} borderWidth="1px" borderRadius="lg" p={4} mb={4}>
                                <Heading size="md" mb={2}>{request.ad.title}</Heading>
                                <Text mb={2}>{request.ad.description}</Text>
                                <Text color="gray.500">
                                {t('date')}: {new Date(request.ad.date).toLocaleDateString()} {request.ad.time}
                                </Text>
                                <Text color="gray.500">{t('availability')}: {request.ad.available}</Text>
                                <Text 
                                    fontWeight="bold" 
                                    color={
                                        request.answer === 1 ? 'green.500' : 
                                        request.answer === 0 ? 'red.500' : 
                                        'yellow.500'
                                    }
                                >
                                    {request.answer === 1 ? 'Accepted' : 
                                     request.answer === 0 ? 'Rejected' : 
                                     t('pending')}
                                </Text>
                                <Button colorScheme="red" onClick={() => handleDeleteRequest(request.id)}>
                                    Cancel
                                </Button>
                            </Box>
                        ))}
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        )}
    </Box>

    {/* Alert Dialog for Confirming Deletion */}
    <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
        <AlertDialogOverlay>
            <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                    {t('deletead')}
                </AlertDialogHeader>
                <AlertDialogCloseButton />
                <AlertDialogBody>
                    {t('areyousuredelete')}
                </AlertDialogBody>
                <AlertDialogFooter>
                    <Button ref={cancelRef} onClick={onDeleteClose}>
                        {t('cancel')}
                    </Button>
                    <Button colorScheme="red" onClick={handleDelete} ml={3}>
                        {t('delete')}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialogOverlay>
    </AlertDialog>

    {/* Alert Dialog for Confirming Action */}
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
            <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                    Confirm Action
                </AlertDialogHeader>
                <AlertDialogCloseButton />
                <AlertDialogBody>
                    Are you sure you want to {selectedRequest?.action} this request?
                </AlertDialogBody>
                <AlertDialogFooter>
                    <Button ref={cancelRef} onClick={onClose}>
                    {t('cancel')}
                    </Button>
                    <Button colorScheme="red" onClick={handleConfirm} ml={3}>
                        {selectedRequest?.action === 'accept' ? 'Accept' : 'Reject'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialogOverlay>
    </AlertDialog>
</Layout>

  );
};

export default MyEvents;
