import React, { useEffect, useState } from 'react';
import { Box, Button, Text, VStack, Spinner } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';  // Import useNavigate
import Cookies from 'js-cookie';
import Layout from './Layout';

const Chat: React.FC = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();  // Initialize navigate

  useEffect(() => {
    const userId = Cookies.get('userId');
    if (!userId) return;

    const fetchChats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}chats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'userid': userId,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch chats');
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
    navigate(`/messages/${slug}`); // Use slug for the chat page
  };
  

  if (loading) {
    return <Spinner size="xl" />;
  }

  return (
    <Layout>
    <Box p={4}>
      <Text fontSize="2xl" mb={4}>Group Chats</Text>
      <VStack spacing={4}>
        {chats.map((chat) => (
          <Button
            key={chat.slug}
            width="100%"
            variant="outline"
            onClick={() => handleChatClick(chat.slug)}
          >
            {chat.group_name}  {/* Change this to your actual chat name field */}
          </Button>
        ))}
      </VStack>
    </Box>
    </Layout>
  );
};

export default Chat;
