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
  first_name: string;
  last_name: string;
  instagram_account: string;
  gender: string;
  requestId: number;
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

const MyEvents: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ requestId: number; adId: number; action: 'accept' | 'reject' } | null>(null);
  
  const cancelRef = useRef<HTMLButtonElement>(null);

  const onOpen = (requestId: number, adId: number, action: 'accept' | 'reject') => {
    console.log(`Opening dialog with requestId: ${requestId}, adId: ${adId}, action: ${action}`);
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
    console.log(`Confirming action: ${action} for requestId: ${requestId}, adId: ${adId}`);
    
    try {
      const response = await fetch(`/requests/${requestId}/${action}`, {
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
                req.requestId === requestId ? { ...req, answer: action === 'accept' ? 1 : 0 } : req
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
        const response = await fetch(`${process.env.REACT_APP_API}ads1?user_id=${userId}`);
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

    const fetchMyRequests = async () => {
      const userId = Cookies.get('userId');
      try {
        const response = await fetch(`${process.env.REACT_APP_API}myrequests?user_id=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch requests');
        const requestsData = await response.json();
        setRequests(requestsData);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch your requests.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchMyEvents();
    fetchMyRequests();
  }, [toast]);

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
            {/* Existing Sections */}
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

      {/* Display the verification status here */}
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
         'Pending'}
      </Text>

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
                  : 'https://i.pinimg.com/736x/1b/2e/31/1b2e314e767a957a44ed8f992c6d9098.jpg'}
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
        <Text>{t('norequests')}</Text>
      )}
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
         'Pending'}
      </Text>
                  </Box>
                ))}
              </AccordionPanel>
            </AccordionItem>

            {/* New Requests Section */}
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
    {requests.length > 0 ? (
      requests.map((request) => (
        <Box key={request.requestId} borderWidth="1px" borderRadius="lg" p={4} mb={4}>
          <Heading size="md" mb={2}>{request.title}</Heading>
          <Text mb={2}>{request.description}</Text>
          <Text color="gray.500">
            {t('date')}: {new Date(request.date).toLocaleDateString()} {request.time}
          </Text>
          <Text color="gray.500">{t('availability')}: {request.available}</Text>
          <Text 
  fontWeight="bold" 
  color={
    request.answer === 1 ? 'green.500' : 
    request.answer === 0 ? 'red.500' : 
    'yellow.500'
  }
>
  {request.answer === 1 ? t('accepted') : 
   request.answer === 0 ? t('rejected') : 
   t('pending')}
</Text>

        </Box>
      ))
    ) : (
      <Text>{t('norequests')}</Text>
    )}
  </AccordionPanel>
</AccordionItem>
          </Accordion>
        )}
      </Box>

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
                Cancel
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
