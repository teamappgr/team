// AdDetail.tsx
import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Spinner, useToast } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import Layout from './Layout'; // Adjust the import path as necessary

interface Ad {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
}

const AdDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get the ad id from the URL parameters
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

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

  return (
    <Layout>
      <Box maxW="800px" mx="auto" p={6}>
        {loading ? (
          <Spinner size="xl" />
        ) : ad ? (
          <>
            <Heading mb={4}>{ad.title}</Heading>
            <Text mb={4}>{ad.description}</Text>
            <Text color="gray.500">
              Date: {new Date(ad.date).toLocaleDateString()} {ad.time}
            </Text>
          </>
        ) : (
          <Text>No ad details found.</Text>
        )}
      </Box>
    </Layout>
  );
};

export default AdDetail;
