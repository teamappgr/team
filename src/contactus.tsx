import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Heading,
  useToast,
  IconButton, // Import IconButton for better UI
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Layout from './Layout';
import { ArrowBackIcon } from '@chakra-ui/icons'; // Import the ArrowBackIcon
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ContactUs: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate(); // Initialize navigate
  const [loading, setLoading] = useState(false); // Loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when form submission starts

    // Example: Sending email using EmailJS or your preferred service
    try {
      const response = await fetch(`${process.env.REACT_APP_API}send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) throw new Error('Failed to send message.');

      toast({
        title:  t('msgsent'),
        description:  t('thankyoucontact'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Clear form
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem sending your message. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }finally {
      setLoading(false); // Reset loading state after submission is complete
    }
  };

  return (
    <Layout>
      <Box maxW="600px" mx="auto" p={6}>
        <Box display="flex" alignItems="center" mb={6}>
          <IconButton
            icon={<ArrowBackIcon />}
            aria-label="Go back to profile"
            onClick={() => navigate(-1)} // Redirect to profile page
            variant="outline" // Optional styling
            colorScheme="teal" // Optional styling
            mr={4} // Add margin to the right for spacing
          />
          <Heading>{t('contactus')}</Heading>
        </Box>
        <form onSubmit={handleSubmit}>
          <FormControl mb={4} isRequired>
            <FormLabel>{t('name')}</FormLabel>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('name')}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('email')}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>{t('message')}</FormLabel>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('message')}
              rows={6}
            />
          </FormControl>
          <Button
            colorScheme="teal"
            type="submit"
            isLoading={loading} // Add Chakra UI's isLoading prop
            loadingText={t('sending')} // Add loading text during submission
          >
            {t('sendmessage')}
          </Button>
        </form>
      </Box>
    </Layout>
  );
};

export default ContactUs;
