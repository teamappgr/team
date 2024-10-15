import React, { useEffect, useState } from 'react';
import { Box, Button, Text, VStack, Spinner } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Layout from './Layout';

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
  const navigate = useNavigate();

  useEffect(() => {
    const userId = Cookies.get('userId');

    if (!userId) {
      console.warn('No userId found in cookies');
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
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setChats(data);
      } catch (error) {
        console.error('Error fetching chats:', error);
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
        <Text fontSize="2xl" mb={4}>Group Chats</Text>
        {loading ? (
          <VStack spacing={4} align="center">
            <Spinner size="xl" />
            <Text>Loading chats...</Text>
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
                    <Text fontWeight="bold"
                    >{chat.group_name}</Text>
                    <Text fontSize="sm" color="gray.500" >
                      {chat.first_name && chat.last_name
                        ? `${chat.first_name} ${chat.last_name}: ${chat.message_text}`
                        : 'No messages yet.'}
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
