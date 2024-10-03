import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  Spinner,
  Input,
  Button,
  HStack,
  Flex,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import moment from 'moment';
import { io } from 'socket.io-client';
import { ArrowBackIcon, InfoIcon } from '@chakra-ui/icons'; // Import InfoIcon

const socket = io(process.env.REACT_APP_API);

const Messages: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<any[]>([]); // State for group members

  const userId = Cookies.get('userId'); // Store userId globally for comparison

  useEffect(() => {
    if (!userId) return;

    const fetchGroupName = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}groups/${slug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            userid: userId,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch group name');
        const data = await response.json();
        setGroupName(data.group_name); // Set the group name state
      } catch (error) {
        console.error('Error fetching group name:', error);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}messages/${slug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            userid: userId,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchGroupMembers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}groups/members/${slug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            userid: userId,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch group members');
        const data = await response.json();
        setGroupMembers(data); // Set the group members state
      } catch (error) {
        console.error('Error fetching group members:', error);
      }
    };

    fetchGroupName(); // Fetch group name first
    fetchMessages(); // Then fetch messages
    fetchGroupMembers(); // Fetch group members

    socket.on('newMessage', (newMsg) => {
      setMessages((prevMessages) => [...prevMessages, newMsg]);
    });

    return () => {
      socket.off('newMessage');
    };
  }, [slug, userId]);

  const handleSendMessage = async () => {
    if (!newMessage || !userId) return;

    socket.emit('sendMessage', {
      slug,
      message: newMessage,
      senderId: userId,
    });

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        message_text: newMessage,
        sender_id: userId,
        created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
        first_name: 'YourFirstName', // Replace with actual sender's first name
        last_name: 'YourLastName', // Replace with actual sender's last name
      },
    ]);

    setNewMessage('');
  };

  const formatDate = (dateString: string) => {
    const date = moment(dateString);
    if (date.isSame(new Date(), 'day')) {
      return `Today, ${date.format('hh:mm A')}`;
    } else {
      return date.format('YYYY-MM-DD, hh:mm A');
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (loading) {
    return <Spinner size="xl" />;
  }

  return (
    <Flex direction="column" h="100vh">
      {/* Back Icon and Group Name */}
      <HStack p={4}>
        <IconButton
          icon={<ArrowBackIcon />}
          aria-label="Back"
          onClick={handleBackClick}
        />
        <Text fontSize="2xl">{groupName}</Text>
        {/* InfoIcon for showing popover */}
        <Popover>
          <PopoverTrigger>
            <IconButton
              icon={<InfoIcon />}
              aria-label="Group Members Info"
              variant="outline"
              ml={2}
            />
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>Group Members</PopoverHeader>
            <PopoverBody>
              {groupMembers.length > 0 ? (
                <VStack align="start">
                  {groupMembers.map((member, index) => (
                    <Text key={index}>
                      {member.first_name} {member.last_name}
                    </Text>
                  ))}
                </VStack>
              ) : (
                <Text>No members in this group.</Text>
              )}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>

      {/* Messages container */}
      <Box p={4} overflowY="auto" flex="1" bg="gray.50">
        <VStack spacing={4} align="stretch"> {/* Changed align to stretch */}
          {messages.map((message) => (
            <Flex
              key={message.message_id}
              justify={message.sender_id === userId ? 'flex-end' : 'flex-start'} // Align messages
              width="100%"
            >
              <Box
                p={4}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                bg={message.sender_id === userId ? 'teal.100' : 'white'} // Change background color
                maxW="70%"
                wordBreak="break-word" // Allow long messages to break
              >
                <Text fontWeight="bold">
                  {message.first_name} {message.last_name}
                </Text>
                <Text>{message.message_text}</Text>
                <Text fontSize="sm" color="gray.500">
                  {formatDate(message.created_at)}
                </Text>
              </Box>
            </Flex>
          ))}
        </VStack>
      </Box>

      {/* Input box fixed at the bottom */}
      <HStack p={4} spacing={4} bg="white" borderTop="1px solid #e2e8f0">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button colorScheme="teal" onClick={handleSendMessage}>
          Send
        </Button>
      </HStack>
    </Flex>
  );
};

export default Messages;
