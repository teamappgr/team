import React, { useState } from 'react';
import { Box, Flex, Icon, Link, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Button } from '@chakra-ui/react';
import { FaHome, FaClipboardList, FaUser, FaPlus } from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // For navigation
import Cookies from 'js-cookie'; // Import js-cookie for cookie management
import SignIn from './SignIn'; // Import your SignIn component

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate(); // useNavigate hook for programmatic navigation
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

  const openSignInModal = () => {
    setIsModalOpen(true); // Open the modal
  };

  // Reusable function to check if the user is authenticated (userId exists in cookies)
  const checkUserAndNavigate = (route: string) => {
    const userId = Cookies.get('userId'); // Fetch the userId from cookies
    if (!userId) {
      // If userId is null, open the sign-in modal
      openSignInModal();
    } else {
      // Else, navigate to the specified route
      navigate(route);
    }
  };

  return (
    <Box>
      {/* Main content */}
      <Box mb="60px"> {/* Adjust for bottom navigation height */}
        {children}
      </Box>

      {/* Bottom Navigation Bar */}
      <Box
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        bg="white"
        borderTop="1px solid #e2e8f0"
        zIndex={10}
        boxShadow="0 -1px 5px rgba(0, 0, 0, 0.1)"
      >
        <Flex justify="space-between" align="center" px={8} py={4} maxW="500px" mx="auto">
          
          {/* Home Link */}
          <Link as={RouterLink} to="/team" _hover={{ textDecor: 'none' }} display="flex" flexDirection="column" alignItems="center">
            <Icon as={FaHome} boxSize={6} color="teal.500" />
            <Text fontSize="xs" mt={1}>Home</Text>
          </Link>

          {/* Ads List Link with user check */}
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            cursor="pointer" 
            onClick={() => checkUserAndNavigate('/myevents')}  // Check user before navigating to /myevents
          >
            <Icon as={FaClipboardList} boxSize={6} color="teal.500" />
            <Text fontSize="xs" mt={1}>My events</Text>
          </Box>

          {/* Create New Ad Link with user check */}
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            cursor="pointer" 
            onClick={() => checkUserAndNavigate('/create')}  // Check user before navigating to /create
          >
            <Icon as={FaPlus} boxSize={6} color="teal.500" />
            <Text fontSize="xs" mt={1}>Create</Text>
          </Box>

          {/* User Profile Link with user check */}
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            cursor="pointer" 
            onClick={() => checkUserAndNavigate('/profile')}  // Check user before navigating to /profile
          >
            <Icon as={FaUser} boxSize={6} color="teal.500" />
            <Text fontSize="xs" mt={1}>Profile</Text>
          </Box>
        </Flex>
      </Box>

      {/* Sign-In Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sign In</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SignIn onClose={() => setIsModalOpen(false)} /> {/* Pass close handler to SignIn */}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Layout;
