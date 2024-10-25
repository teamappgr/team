import React from 'react';
import { Box, Heading, Text, Image, Flex, IconButton } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
  const navigate = useNavigate(); // Hook to navigate between pages
  const appVersion = '1.0.0'; // Update this with your app's version
  const { t } = useTranslation();

  return (
    <Box height="100vh" p={4}>
      {/* Back Button and Heading aligned to the top left */}
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton
          icon={<ArrowBackIcon />}
          aria-label="Go back to profile"
          onClick={() => navigate(-1)} // Redirect to previous page
          variant="outline" // Optional styling
          colorScheme="teal" // Optional styling
          mr={2} // Add margin to the right for spacing
        />
        <Heading as="h1" size="lg">{t('about')}</Heading>
      </Box>

      {/* Centered Content */}
      <Flex
        height="80vh" // Control the height for centering
        alignItems="center" // Center vertically
        justifyContent="center" // Center horizontally
        direction="column" // Stack children vertically
        textAlign="center" // Center text
      >
        <Image
          src="origin.png" // Replace with the path to your logo
          alt="Site Logo"
          boxSize="150px" // Adjust the size as needed
          mb={4} // Margin-bottom for spacing
        />
        <Text fontSize="lg">
        {t('version')}: {appVersion}
        </Text>
      </Flex>
    </Box>
  );
};

export default About;
