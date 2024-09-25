import React from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import Button from '@mui/material/Button';
import { Box } from '@mui/material'; // Import Box for layout

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng); // Change language
  };

  return (
    <Box display="flex" justifyContent="flex-end" sx={{ mb: 2 }}>
      <Button onClick={() => changeLanguage('en')} variant="text">English</Button>
      <Button onClick={() => changeLanguage('el')} variant="text">Ελληνικά</Button>
    </Box>
  );
};

export default LanguageSelector;
