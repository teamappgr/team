import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import Button from '@mui/material/Button';
import { Box } from '@mui/material'; // Import Box for layout
import Cookies from 'js-cookie'; // Import Cookies

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng); // Change language
    Cookies.set('language', lng); // Save the selected language to cookies
  };

  useEffect(() => {
    // Check if the language cookie exists and set the language
    const language = Cookies.get('language');
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [i18n]); // Run effect once on component mount

  return (
    <Box display="flex" justifyContent="flex-end" sx={{ mb: 2 }}>
      <Button onClick={() => changeLanguage('en')} variant="text">English</Button>
      <Button onClick={() => changeLanguage('el')} variant="text">Ελληνικά</Button>
    </Box>
  );
};

export default LanguageSelector;
