// src/components/ResetPassword.tsx

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Heading,
  useToast,
  Flex
} from '@chakra-ui/react';
import Visibility from '@mui/icons-material/Visibility'; // Import Visibility icon
import VisibilityOff from '@mui/icons-material/VisibilityOff';
const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const toast = useToast(); // For toast notifications
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Function to extract query parameters from the URL
  const useQuery = () => {
    return new URLSearchParams(useLocation().search);
  };

  const query = useQuery();
  const token = query.get('token'); // Get the token from the URL
  const handleToggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API}reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success toast
        toast({
          title: "Success",
          description: "Password reset successfully!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        setMessage('Password reset successfully!');
        setError('');
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Error resetting password. Please try again later.');
    }
  };

  return (
    <Box maxWidth="400px" mx="auto" p={5}>
      <Heading as="h2" size="lg" mb={4}>Reset Password</Heading>
      <form onSubmit={handleSubmit}>
      <FormControl isRequired mb={4}>
        <FormLabel htmlFor="newPassword">New Password:</FormLabel>
        <Flex align="center">
          <Input
            type={showNewPassword ? 'text' : 'password'} // Toggle input type
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            pr="40px" // Add right padding to make space for the icon
          />
          <Button 
            onClick={handleToggleNewPasswordVisibility} 
            style={{ padding: 0, marginLeft: '-40px', zIndex: 1 }} // Adjust position of the button
          >
            {showNewPassword ? <VisibilityOff /> : <Visibility />} {/* Toggle icon */}
          </Button>
        </Flex>
      </FormControl>

      <FormControl isRequired mb={4}>
        <FormLabel htmlFor="confirmPassword">Confirm Password:</FormLabel>
        <Flex align="center">
          <Input
            type={showConfirmPassword ? 'text' : 'password'} // Toggle input type
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            pr="40px" // Add right padding to make space for the icon
          />
          <Button 
            onClick={handleToggleConfirmPasswordVisibility} 
            style={{ padding: 0, marginLeft: '-40px', zIndex: 1 }} // Adjust position of the button
          >
            {showConfirmPassword ? <VisibilityOff /> : <Visibility />} {/* Toggle icon */}
          </Button>
        </Flex>
      </FormControl>
        {error && <Text color="red.500" mb={4}>{error}</Text>}
        {message && <Text color="green.500" mb={4}>{message}</Text>}
        <Button colorScheme="blue" type="submit" width="full">
          Reset Password
        </Button>
      </form>
    </Box>
  );
};

export default ResetPassword;
