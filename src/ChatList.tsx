import React, { useEffect, useState } from 'react';
import { Box, Button, Text, VStack, Spinner } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Layout from './Layout';

const Chat: React.FC = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = Cookies.get('userId');
    
    // Early return if no userId is found
    if (!userId) {
      console.warn('No userId found in cookies');
      setLoading(false); // Stop loading if no userId is found
      return;
    }

    const fetchChats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}chats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'userid': userId,
          },
        });

        // Check for HTTP errors
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setChats(data);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false); // Always stop loading when done
      }
    };

    fetchChats();
  }, []);

  const handleChatClick = (slug: string) => {
    navigate(`/messages/${slug}`); // Use slug for the chat page
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
                  {chat.group_name} {/* Change this to your actual chat name field */}
                </Button>
              ))
            ) : (
              <Text>No chats available.</Text> // Handling case where no chats are returned
            )}
          </VStack>
        )}
      </Box>
    </Layout>
  );
};

export default Chat;
