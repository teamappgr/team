import React, { useState } from 'react';
import { Box, Flex, Icon, Link, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody } from '@chakra-ui/react';
import { FaHome, FaClipboardList, FaUser, FaPlus } from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ChatIcon } from '@chakra-ui/icons'
import Cookies from 'js-cookie';
import SignIn from './SignIn';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation(); // Hook for translation
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openSignInModal = () => {
    setIsModalOpen(true);
  };

  const checkUserAndNavigate = (route: string) => {
    const userId = Cookies.get('userId');
    if (!userId) {
      openSignInModal();
    } else {
      navigate(route);
    }
  };

  return (
    <Box>
      <Box mb="60px">
        {children}
      </Box>

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
          
          <Link as={RouterLink} to="/team" _hover={{ textDecor: 'none' }} display="flex" flexDirection="column" alignItems="center">
            <Icon as={FaHome} boxSize={6} color="teal.500" />
            <Text fontSize="xs" mt={1}>{t('home')}</Text>
          </Link>

          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            cursor="pointer" 
            onClick={() => checkUserAndNavigate('/myevents')}
          >
            <Icon as={FaClipboardList} boxSize={6} color="teal.500" />
            <Text fontSize="xs" mt={1}>{t('showmyevents')}</Text>
          </Box>

          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            cursor="pointer" 
            onClick={() => checkUserAndNavigate('/create')}
          >
            <Icon as={FaPlus} boxSize={6} color="teal.500" />
            <Text fontSize="xs" mt={1}>{t('create')}</Text>
          </Box>

          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            cursor="pointer" 
            onClick={() => checkUserAndNavigate('/chat')}
          >
            <Icon as={ChatIcon} boxSize={6} color="teal.500" />
            <Text fontSize="xs" mt={1}>{t('Chat')}</Text>
          </Box>

          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            cursor="pointer" 
            onClick={() => checkUserAndNavigate('/profile')}
          >
            <Icon as={FaUser} boxSize={6} color="teal.500" />
            <Text fontSize="xs" mt={1}>{t('profile')}</Text>
          </Box>
        </Flex>
      </Box>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('signIn')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SignIn onClose={() => setIsModalOpen(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Layout;
