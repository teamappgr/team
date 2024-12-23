import React, { useEffect, useState } from 'react';
import { Box, Button, Text, VStack, Spinner,Heading } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Layout from './Layout';
import { useTranslation } from 'react-i18next';

interface Chat {
  slug: string;
  group_name: string;
  message_text: string;
  first_name: string;
  last_name: string;
  sent_at: string;
}

const Chat: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const userId = Cookies.get('userId');

    if (!userId) {
      console.warn('No userId found in cookies');
      setError('User ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    const fetchChats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}chats/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Handle the case when there are no chats for the user.
            setError(t('nomessages'));
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return;
        }

        const data = await response.json();
        setChats(data);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to load chats. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const handleChatClick = (slug: string) => {
    navigate(`/messages/${slug}`);
  };

  return (
    <Layout>
      <Box p={4}>
      <Heading mb={6} textAlign="center" color="teal.600">
      {t('chat')}

        </Heading>        
        {loading ? (
          <VStack spacing={4} align="center">
            <Spinner size="xl" />
            <Text>Loading chats...</Text>
          </VStack>
        ) : error ? (
          <VStack spacing={4} align="center">
            <Text color="red.500">{error}</Text>
          </VStack>
        ) : (
          <VStack spacing={4}>
            {chats.length > 0 ? (
              chats.map((chat) => (
                <Button
                  key={chat.slug}
                  width="100%"
                  variant="outline"
                  onClick={() => handleChatClick(chat.slug)}
                >
                  <Box textAlign="left">
                    <Text fontWeight="bold">{chat.group_name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {chat.first_name && chat.last_name
                        ? `${chat.first_name} ${chat.last_name}: ${chat.message_text}`
                        : t('nomessages')}
                    </Text>
                  </Box>
                </Button>
              ))
            ) : (
              <Text>No chats available.</Text>
            )}
          </VStack>
        )}
      </Box>
    </Layout>
  );
};

export default Chat;
