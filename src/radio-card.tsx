import React from 'react';
import { RadioGroup, HStack, Radio, Box, Stack } from '@chakra-ui/react';
import { Female, Male } from '@mui/icons-material'; // Import Material UI icons
import { useTranslation } from 'react-i18next';

interface GenderRadioCardProps {
  value: boolean | null;
  onChange: (value: boolean | null) => void; // Updated to accept boolean or null
}

export const GenderRadioCard: React.FC<GenderRadioCardProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <RadioGroup value={value === null ? 'mixed' : value ? 'women' : 'men'} onChange={(val) => {
      if (val === 'women') {
        onChange(true);  // true represents Women
      } else if (val === 'men') {
        onChange(false); // false represents Men
      } else {
        onChange(null);  // null represents Mixed
      }
    }}>
      <Stack spacing={4}>
        <HStack spacing={2} wrap="nowrap" justify="space-between">
          {/* Women Only Radio Button */}
          <Box borderWidth="1px" borderRadius="lg" p={2} width="auto">
            <Radio value="women" size="sm">
              <HStack spacing={0} align="center">
                <Female fontSize="small" />
                <Box as="span" fontSize="sm">{t('onlywomen')}</Box>
              </HStack>
            </Radio>
          </Box>

          {/* Mixed Radio Button */}
          <Box borderWidth="1px" borderRadius="lg" p={2} width="auto">
            <Radio value="mixed" size="sm">
              <HStack spacing={0} align="center">
                <Box width={4} height={4} borderRadius="full" bg="gray.400" />
                <Box as="span" fontSize="sm">{t('mixed')}</Box>
              </HStack>
            </Radio>
          </Box>

          {/* Men Only Radio Button */}
          <Box borderWidth="1px" borderRadius="lg" p={2} width="auto">
            <Radio value="men" size="sm">
              <HStack spacing={0} align="center">
                <Male fontSize="small" />
                <Box as="span" fontSize="sm">{t('onlymen')}</Box>
              </HStack>
            </Radio>
          </Box>
        </HStack>
      </Stack>
    </RadioGroup>
  );
};
