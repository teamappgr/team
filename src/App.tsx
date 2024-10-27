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
import Settings from './settings';
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
import About from './about';
import Profile from './profile';

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
            <Route path="/settings" element={<Settings />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot" element={<ForgotPassword />} />
              <Route path="/create" element={<Create />} />
              <Route path="/event/:title/:id" element={<EventDetail />} /> {/* Updated route with title and id parameters */}
              <Route path="/myevents" element={<MyEvents />} />
              <Route path="/signin" element={<SignIn1 />} />
              <Route path="/contactus" element={<ContactUs />} />
              <Route path="/" element={<Team />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/messages/:slug" element={<MessagePage />} />
              <Route path="/about" element={<About />} />
              <Route path="/profile" element={<Profile />} />

            </Routes>
          </Router>
        </div>
      </ChakraProvider>
    </ThemeProvider>
  );
};

export default App;
