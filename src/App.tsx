import React, { useState, useEffect } from 'react';
import './App.css';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import SignIn from './SignIn';
import SignIn1 from './SignIn copy';
import ContactUs from './contactus'; 
import SignUp from './SignUp';
import Create from './create'; 
import Profile from './profile';
import Team from './team'; 
import Chat from './ChatList'; 
import MessagePage from './messagepage';
import EventDetail from './eventdetail';
import './i18n';
import MyEvents from './myevents';
import { Modal, ModalOverlay, ModalContent } from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import ForgotPassword from './forgotpassword';
import ResetPassword from './resetpassword';
// Create a default theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  const [isSignInOpen, setSignInOpen] = useState(false);

  const openSignIn = () => setSignInOpen(true);
  const closeSignIn = () => setSignInOpen(false);

  useEffect(() => {
    
 }, []);

  return (
    <ThemeProvider theme={theme}>
      <ChakraProvider>
        <CssBaseline />
        <div className="App">
          <Router>
            <Modal isOpen={isSignInOpen} onClose={closeSignIn}>
              <ModalOverlay />
              <ModalContent>
                <SignIn onClose={closeSignIn} />
              </ModalContent>
            </Modal>
            <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<SignUp />} />
              <Route path="/forgot" element={<ForgotPassword />} />
              <Route path="/create" element={<Create />} />
              <Route path="/event" element={<EventDetail />} />
              <Route path="/myevents" element={<MyEvents />} />
              <Route path="/signin" element={<SignIn1 />} />
              <Route path="/contactus" element={<ContactUs />} />
              <Route path="/team" element={<Team />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/messages/:slug" element={<MessagePage />} />

            </Routes>
          </Router>
        </div>
      </ChakraProvider>
    </ThemeProvider>
  );
};

export default App;
