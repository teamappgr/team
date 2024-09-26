// Team.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Layout from './Layout'; // Import the Layout component

interface Ad {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
}

const Team: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate(); // Initialize the navigate function

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}ads`);
        const data = await response.json();
        if (response.ok) {
          const filteredAds = data.filter((ad: Ad) => new Date(ad.date) >= new Date());
          setAds(filteredAds);
        } else {
          toast({
            title: 'Error fetching ads',
            description: data.message || 'Unable to fetch ads.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
        toast({
          title: 'Network Error',
          description: 'Unable to connect to the server. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [toast]);

  // Handle navigation to the ad detail page
  const handleAdClick = (id: number) => {
    navigate(`/event/${id}`); // Navigate to the detail page for the clicked ad
  };

  return (
    <Layout>
      <Box maxW="1200px" mx="auto" p={6}>
        <Heading mb={6} textAlign="center" color="teal.600">
          Current Ads
        </Heading>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <Spinner size="xl" />
          </Box>
        ) : (
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            {ads.length > 0 ? (
              ads.map((ad) => (
                <Card key={ad.id} borderWidth="1px" borderRadius="lg" onClick={() => handleAdClick(ad.id)} cursor="pointer">
                  <CardHeader>
                    <Heading size="md">{ad.title}</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text>{ad.description}</Text>
                    <Text mt={2} color="gray.500">
                      Date: {new Date(ad.date).toLocaleDateString()} {ad.time}
                    </Text>
                  </CardBody>
                </Card>
              ))
            ) : (
              <Text textAlign="center" width="100%">
                No current ads available.
              </Text>
            )}
          </SimpleGrid>
        )}
      </Box>
    </Layout>
  );
};

export default Team;
