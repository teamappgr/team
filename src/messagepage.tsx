import React, { useEffect, useState, useRef } from 'react';
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
import { ArrowBackIcon, InfoIcon } from '@chakra-ui/icons';
import CryptoJS from 'crypto-js';

const socket = io(process.env.REACT_APP_API); // Connect to the Socket.IO server

const Messages: React.FC = () => {
  const { slug } = useParams<{ slug: string }>(); // Get group slug from URL
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]); // Store messages
  const [loading, setLoading] = useState(true); // Loading state
  const [newMessage, setNewMessage] = useState(''); // New message input
  const [groupName, setGroupName] = useState(''); // Group name
  const [groupMembers, setGroupMembers] = useState<any[]>([]); // Group members
  const [userInfo, setUserInfo] = useState<{ first_name: string; last_name: string } | null>(null); // User info
  const [decryptedUserId, setDecryptedUserId] = useState<string | null>(null); // Decrypted user ID state
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // Reference for scrolling to the bottom
  const secretKey = process.env.REACT_APP_SECRET_KEY || 'your-secret-key'; // Use your actual secret key


  useEffect(() => {
    const userId = Cookies.get('userId');

    // Fetch user info
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}users/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch user info');
        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    // Fetch group name
    const fetchGroupName = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}groups/${slug}`, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch group name');
        const data = await response.json();
        setGroupName(data.group_name);
      } catch (error) {
        console.error('Error fetching group name:', error);
      }
    };

    // Fetch messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}messages/${slug}/${userId}`, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data); // Set messages state
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch group members
    const fetchGroupMembers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}groups/members/${slug}/${userId}`, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 403) {
          navigate('/team');
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch group members');

        const data = await response.json();
        setGroupMembers(data);
      } catch (error) {
        console.error('Error fetching group members:', error);
      }
    };

    fetchUserInfo();
    fetchGroupName();
    fetchMessages();
    fetchGroupMembers();

    // Join the group on socket connection
    socket.emit('joinGroup', { slug, userId: userId });

    // Listen for new messages and update state
    socket.on('newMessage', (newMsg) => {
      setMessages((prevMessages) => [...prevMessages, newMsg]); // Update messages state
    });

    return () => {
      socket.emit('leaveGroup', { slug, userId: userId });
      socket.off('newMessage'); // Clean up listener on component unmount
    };
  }, [slug, decryptedUserId, navigate]);

  // Scroll to the bottom of the messages container when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);



  // Send new message function
  const handleSendMessage = async () => {
    if (!newMessage || !userInfo) return; // Do nothing if message is empty or user info is not available
  
    const userId = Cookies.get('userId');

    const newMsg = {
      slug,
      message: newMessage,
      senderId: userId, // Send the encrypted user ID
    };
  
    // Emit the message through Socket.IO
    socket.emit('sendMessage', newMsg);
  
    // Immediately update the local state with the new message
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        message_text: newMessage,
        sender_id: decryptedUserId, // Use the decrypted user ID internally
        created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
      },
    ]);
  
    setNewMessage(''); // Clear input field after sending
  };

  // Format message date
  const formatDate = (dateString: string) => {
    const date = moment(dateString);
    if (date.isSame(new Date(), 'day')) {
      return `Today, ${date.format('hh:mm A')}`;
    } else {
      return date.format('YYYY-MM-DD, hh:mm A');
    }
  };

  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  if (loading) {
    return <Spinner size="xl" />; // Show loading spinner while fetching data
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
        <Popover>
          <PopoverTrigger>
            <IconButton
              icon={<InfoIcon />}
              aria-label="Group Info"
              ml="auto"
            />
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>Group Members</PopoverHeader>
            <PopoverBody>
              <VStack align="start">
                {groupMembers.map((member) => (
                  <Text key={member.user_id}>
                    {member.first_name} {member.last_name}
                  </Text>
                ))}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>

      {/* Messages Display */}
      <Box flex="1" overflowY="auto" px={4} py={2}>
        <VStack align="start" spacing={4}>
          {messages.map((msg, idx) => (
            <Box key={idx} alignSelf={msg.sender_id === decryptedUserId ? 'flex-end' : 'flex-start'}>
              <Text fontSize="sm" color="gray.500">
                {msg.first_name} {msg.last_name} - {formatDate(msg.created_at)}
              </Text>
              <Text bg={msg.sender_id === decryptedUserId ? 'blue.200' : 'gray.200'} p={2} borderRadius="md">
                {msg.message_text}
              </Text>
            </Box>
          ))}
        </VStack>
        <div ref={messagesEndRef} /> {/* Element to scroll to */}
      </Box>

      {/* Message Input */}
      <HStack p={4} spacing={2}>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <Button onClick={handleSendMessage} colorScheme="blue">
          Send
        </Button>
      </HStack>
    </Flex>
  );
};

export default Messages;
