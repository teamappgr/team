import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Button,
  useToast,
} from '@chakra-ui/react';
import Cookies from 'js-cookie'; // Import Cookies for managing user ID
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
  info?: string;
}

const MyEvents: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

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
        const data = await response.json();
        setAds(data);
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
            {/* Additional details if needed */}
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
    </Box>
    </Layout>
  );
};

export default MyEvents;
