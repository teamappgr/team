// App.tsx
import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Import createTheme
import { CssBaseline } from '@mui/material';
import SignIn from './SignIn';
import SignUp from './SignUp'; // Import SignUp component
import Create from './create'; 
import Profile from './profile';
import TeamFor from './teamfor'; 
import './i18n'; // Import your i18n configuration
import LanguageSelector from './LanguageSelector'; // Adjust the path as necessary

import { ChakraProvider } from '@chakra-ui/react';

// Create a default theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Example primary color
    },
    secondary: {
      main: '#dc004e', // Example secondary color
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <ChakraProvider>
        <CssBaseline />
        <div className="App">
          {/* Language Selector */}
          <LanguageSelector />
          <Router>
            <Routes>
              {/* Route for the SignIn page */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/profile" element={<Profile />} />

              {/* Route for the SignUp page */}
              <Route path="/" element={<SignUp />} />
              <Route path="/create" element={<Create />} />
              <Route path="/teamfor" element={<TeamFor />} />
            </Routes>
          </Router>
        </div>
      </ChakraProvider>
    </ThemeProvider>
  );
};

export default App;
