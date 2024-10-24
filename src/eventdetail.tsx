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
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useLocation
import Cookies from 'js-cookie';
import Layout from './Layout';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';

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
  const location = useLocation();
  const adId = location.state?.adId; // Read adId from state
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!adId) {
      toast({
        title: t('errorFetchingAdDetails'),
        description: t('noAdIdProvided'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const fetchAdDetail = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}ads/${adId}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch ad detail');
        }
        const data = await response.json();
        setAd(data);
      } catch (error) {
        toast({
          title: t('errorFetchingAdDetails'),
          description: t('tryAgainLater'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdDetail();
  }, [adId, toast, t]);

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
        {/* Back Button */}
        <Box display="flex" alignItems="center" mb={4}>
          <IconButton
            icon={<ArrowBackIcon />}
            aria-label={t('gohome')}
            onClick={() => navigate('/team')}
            variant="outline"
            colorScheme="teal"
            mr={4}
          />
          <Heading>{loading ? t('loading') : ad ? ad.title : t('noAdFound')}</Heading>
        </Box>

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
        {ad && ad.available > 0 && (
          <Button colorScheme="teal" onClick={handleButtonClick} mb={4}>
            {t('iWantToGo')}
          </Button>
        )}
      </Box>
    </Layout>
  );
};

export default AdDetail;
