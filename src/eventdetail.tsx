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
  IconButton,
  Flex,
  Image
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams
import Cookies from 'js-cookie';
import Layout from './Layout';
import { ArrowBackIcon,ExternalLinkIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import ShareIcon from '@mui/icons-material/Share';
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
interface GenderData {
  maleCount: number;
  femaleCount: number;
}
const AdDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get the ID from the URL
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const shareUrl = `${window.location.origin}/team/#/event/${ad?.title.replace(/\s+/g, '-').replace(/[^\p{L}\d-]/gu, '')}/${ad?.id}`;
  const [genderData, setGenderData] = useState<GenderData | null>(null);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad?.title || t('adDetails'),
          text: t('checkOutThisEvent'),
          url: shareUrl,
        });
        toast({
          title: t('sharedSuccessfully'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {

      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: t('linkCopied'),
          description: shareUrl,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: t('copyFailed'),
          description: t('tryAgain'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  useEffect(() => {
    if (!id) {
      // Redirect to a different page if no ID is provided
      toast({
        title: t('errorFetchingAdDetails'),
        description: t('noAdIdProvided'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/team'); // Redirect to the team page or any other relevant page
      return;
    }
    const fetchAdData = async () => {
      setLoading(true);
      try {
        // Fetch Ad details
        const adResponse = await fetch(`${process.env.REACT_APP_API}ads/${id}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!adResponse.ok) {
          throw new Error('Failed to fetch ad detail');
        }
        const adData = await adResponse.json();
        setAd(adData);

        // Fetch Gender data
        const genderResponse = await fetch(`${process.env.REACT_APP_API}gender/${id}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!genderResponse.ok) {
          throw new Error('Failed to fetch gender data');
        }
        const genderData: GenderData = await genderResponse.json();
        setGenderData(genderData);

      } catch (error) {
        console.error('Error:', error);
        toast({
          title: 'Error Fetching Data',
          description: 'Please try again later',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdData();
  }, [id, toast, t, navigate]);

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
        title: t('error'),
        description: t('mustBeLoggedIn'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const userResponse = await fetch(`${process.env.REACT_APP_API}profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const userData = await userResponse.json();

      if (!userData || !userData.verified) {
        toast({
          title: t('error'),
          description: t('accountNotVerified'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API}requests/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ad_id: ad?.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create request');
      }

      toast({
        title: t('success'),
        description: t('expressedInterest'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('alreadyRequested'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
    }
  };

  return (
    <Layout>
      <Box maxW="800px" mx="auto" p={6}>
      <Flex justify="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center">
            <IconButton
              icon={<ArrowBackIcon />}
              aria-label={t('gohome')}
              onClick={() => navigate(-1)}
              variant="outline"
              colorScheme="teal"
              mr={4}
            />
            <Heading>{loading ? t('loading') : ad ? ad.title : t('noAdFound')}</Heading>
          </Box>
          {/* Share Button */}
          <IconButton
      icon={<ShareIcon />}
      aria-label={t('share')}
            onClick={handleShare}
            colorScheme="teal"
            variant="outline"
          />
        </Flex>

        {loading ? (
          <Spinner size="xl" />
        ) : ad ? (
          <>
            <Text mb={4}>{ad.description}</Text>
            {ad.info && (
              <Text mb={4} fontStyle="italic" color="gray.600">
                {t('from')}: {ad.info}
              </Text>
            )}
            <Text color="gray.500">
              {t('date')}: {new Date(ad.date).toLocaleDateString()} {ad.time}
            </Text>
            <Box mt={4}>
              <Text fontWeight="bold">{t('progress')}:</Text>
              <Progress hasStripe value={calculateProgress(ad.min, ad.max, ad.available)} colorScheme="teal" />
              <Text mt={2}>
                {calculatePeopleNeeded(ad.min, ad.max, ad.available)} {t('peopleNeeded')}.
              </Text>
              {getLastAvailablePositions(ad.min, ad.max, ad.available) !== null && (
                <Text mt={2} color="red.500">
                  {t('lastAvailablePositions')}: {getLastAvailablePositions(ad.min, ad.max, ad.available)}
                </Text>
                
              )}
            </Box>
            {genderData ? (

<Flex alignItems="center" justify="center" mb={4}> {/* Flex container for gender data */}
<Flex alignItems="center" mr={4}> {/* Group male image and count */}
  <Image src="male.jpg" alt="Male" boxSize="50px" objectFit="cover" />
  <Text ml={2}>{genderData.maleCount}</Text>
</Flex>
<Flex alignItems="center"> {/* Group female image and count */}
  <Image src="female.jpg" alt="Female" boxSize="50px" objectFit="cover" />
  <Text ml={2}>{genderData.femaleCount}</Text>
</Flex>
</Flex>
) : (
  <Text color="gray.500">Gender data not available.</Text>
)}
        {ad && ad.available > 0 && (
          <Button colorScheme="teal" onClick={handleButtonClick} mb={4}>
            {t('iWantToGo')}
          </Button>
        )}
            <AlertDialog
              motionPreset="slideInBottom"
              leastDestructiveRef={cancelRef}
              onClose={onClose}
              isOpen={isOpen}
              isCentered
            >
              <AlertDialogOverlay />
              <AlertDialogContent>
                <AlertDialogHeader>{t('confirmYourAttendance')}</AlertDialogHeader>
                <AlertDialogCloseButton />
                <AlertDialogBody>{t('sureInterest')}</AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onClose}>
                    {t('no')}
                  </Button>
                  <Button colorScheme="teal" ml={3} onClick={handleConfirm}>
                    {t('yes')}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <Text>{t('noAdDetailsFound')}</Text>
        )}

      </Box>
    </Layout>
  );
};

export default AdDetail;
