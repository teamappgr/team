// ForgotPassword.tsx

import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Heading,
  Flex,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons'; // Import the back icon

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const toast = useToast(); // To show notifications

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API}send-email1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'User',
          email: email,
          message: 'Please reset my password.',
        }),
      });

      if (!response.ok) {
        throw new Error('Error sending email');
      }

      const data = await response.text();
      setMessage(data); // Assuming the backend sends a success message

      // Show success toast
      toast({
        title: "Success",
        description: "Password reset email sent successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      setError('Something went wrong. Please try again.');

      // Show error toast
      toast({
        title: "Error",
        description: "There was an error sending the email.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxWidth="400px" mx="auto" p={5}>
      {/* Flex container to align the back icon and heading */}
      <Flex align="center" mb={4}>
        <IconButton
          aria-label="Back"
          icon={<ArrowBackIcon />}
          onClick={() => window.history.back()} // Navigate back
          mr={2} // Margin right for spacing
        />
        <Heading as="h2" size="lg">
          Forgot Your Password?
        </Heading>
      </Flex>
      <form onSubmit={handleSubmit}>
        <FormControl isRequired mb={4}>
          <FormLabel htmlFor="email">Email:</FormLabel>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
          />
        </FormControl>
        <Button colorScheme="blue" type="submit" width="full">
          Send Reset Link
        </Button>
      </form>
      {message && <Text color="green.500" mt={4}>{message}</Text>}
      {error && <Text color="red.500" mt={4}>{error}</Text>}
    </Box>
  );
};

export default ForgotPassword;
