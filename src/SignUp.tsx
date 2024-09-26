import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Input,
  Text,
  Flex,
  Progress,
  Select, 
  Checkbox,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  Step,
  StepDescription,
  StepIndicator,
  StepStatus,
  StepTitle,
  StepSeparator,
  Stepper,
  useSteps,
} from '@chakra-ui/react';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';

const steps = [
  { title: 'contactInfo', description: 'fillContactInfo' },
  { title: 'uploadImage', description: 'uploadImageDescription' },
  { title: 'instagramInfo', description: 'enterInstagramInfo' },
];

const SignUp: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // For camera-captured image
  const [uploadedImage, setUploadedImage] = useState<File | null>(null); // For file-uploaded image

  useEffect(() => {
    const userId = Cookies.get('userId');
    if (userId) {
      navigate('/create');
    }
  }, [navigate]);

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    instagramAccount: '',
    password: '',
  });

  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUniversity(e.target.value);
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermsAccepted(e.target.checked);
  };

  const validateFields = () => {
    const { firstName, lastName, email, phone, instagramAccount, password } = formData;

    if (activeStep === 0) {
      if (!email.includes('@') || !email.includes('.com')) {
        toast({
          title: t('invalidEmail'),
          description: t('invalidEmailDescription'),
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        return false;
      }
      return firstName && lastName && email && phone;
    } else if (activeStep === 1) {
      return (capturedImage !== null || uploadedImage !== null) && selectedUniversity !== null;
    } else if (activeStep === 2) {
      return instagramAccount && password && termsAccepted;
    }
    return false;
  };

  const handleNext = () => {
    if (!validateFields()) {
      toast({
        title: t('missingFields'),
        description: t('missingFields'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      toast({
        title: t('missingFields'),
        description: t('missingFields'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const formDataToSubmit = new FormData();
    formDataToSubmit.append('firstName', formData.firstName);
    formDataToSubmit.append('lastName', formData.lastName);
    formDataToSubmit.append('email', formData.email);
    formDataToSubmit.append('phone', formData.phone);

    // Add image (either from file upload or camera capture)
    if (uploadedImage) {
      formDataToSubmit.append('image', uploadedImage);
    } else if (capturedImage) {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      formDataToSubmit.append('image', new File([blob], 'captured-image.png', { type: 'image/png' }));
    }

    formDataToSubmit.append('instagramAccount', formData.instagramAccount);
    formDataToSubmit.append('password', formData.password);
    formDataToSubmit.append('university', selectedUniversity || '');

    try {
      const response = await fetch(process.env.REACT_APP_API + 'signup', {
        method: 'POST',
        body: formDataToSubmit,
      });
      if (response.ok) {
        const result = await response.json();
        Cookies.set('userId', result.userId);
        navigate('/teamfor');
      } else {
        toast({
          title: t('userIdError'),
          description: t('userIdError'),
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: t('networkError'),
        description: t('networkError'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'user' } }, // Request the environment (back) camera
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      toast({
        title: t('cameraError'),
        description: t('cameraErrorDescription'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };
  


  const captureImage = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageDataUrl = canvasRef.current.toDataURL('image/png');
        setCapturedImage(imageDataUrl);
        setIsCameraOpen(false);
      }
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      setCapturedImage(null); // Clear the camera image if a file is selected
    }
  };

  return (
    <Flex height="100vh" width="100vw" alignItems="center" justifyContent="center" backgroundColor="gray.50">
      <Box width="400px" p={8} border="1px solid lightgray" borderRadius="md" bg="white" shadow="md">
        <VStack spacing={4} align="stretch">
          <Text fontSize="2xl" mb={4} textAlign="left">{t('signUp')}</Text>
          <Progress value={(activeStep + 1) * (100 / steps.length)} mb={4} />

          <Stepper index={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator>
                  <StepStatus
                    complete={<Text color="green.500">✔️</Text>}
                    incomplete={<Text color="gray.300">{index + 1}</Text>}
                    active={<Text color="blue.500">{index + 1}</Text>}
                  />
                </StepIndicator>
                <Box flexShrink="0">
                  <Box textAlign="left">
                    <StepTitle>{t(step.title)}</StepTitle>
                    <StepDescription>{t(step.description)}</StepDescription>
                  </Box>
                </Box>
                <StepSeparator />
              </Step>
            ))}
          </Stepper>

          <Box>
            {activeStep === 0 && (
              <>
                <Input
                  placeholder={t('firstName')}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  mb={3}
                  required
                />
                <Input
                  placeholder={t('lastName')}
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  mb={3}
                  required
                />
                <Input
                  placeholder={t('email')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  mb={3}
                  required
                />
                <Input
                  placeholder={t('phone')}
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </>
            )}

            {activeStep === 1 && (
              <>
                {!capturedImage && !uploadedImage && (
                  <>
                    {isCameraOpen ? (
                      <>
                        <video ref={videoRef} style={{ width: '100%' }} />
                        <Button onClick={captureImage} mt={3}>
                          {t('captureImage')}
                        </Button>
                        <Button onClick={closeCamera} mt={3} ml={3}>
                          {t('closeCamera')}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={openCamera} mb={3}>
                        {t('openCamera')}
                      </Button>
                    )}
                    <Text mt={3}>{t('or')}</Text>
                    <Input type="file" accept="image/*" onChange={handleFileChange} mt={3} />
                  </>
                )}

                {capturedImage && (
                  <>
                    <img src={capturedImage} alt="Captured" style={{ width: '100%' }} />
                    <Button onClick={() => setCapturedImage(null)} mt={3}>
                      {t('retakeImage')}
                    </Button>
                  </>
                )}

                {uploadedImage && (
                  <>
                    <Text>{uploadedImage.name}</Text>
                    <Button onClick={() => setUploadedImage(null)} mt={3}>
                      {t('removeImage')}
                    </Button>
                  </>
                )}

                <Select
                  placeholder={t('selectUniversity')}
                  value={selectedUniversity || ''}
                  onChange={handleUniversityChange}
                  required
                >
                  <option value="Pan. Pireos">Παπει</option>
                </Select>

                <canvas ref={canvasRef} style={{ display: 'none' }} width="400" height="300" />
              </>
            )}

            {activeStep === 2 && (
              <>
                <Input
                  placeholder={t('instagramAccount')}
                  value={formData.instagramAccount}
                  onChange={(e) => handleInputChange('instagramAccount', e.target.value)}
                  mb={3}
                  required
                />
                <Input
                  placeholder={t('instagramPassword')}
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <Checkbox
                  isChecked={termsAccepted}
                  onChange={handleTermsChange}
                >
                  {t('acceptTerms')}
                </Checkbox>
              </>
            )}
          </Box>

          <Flex justifyContent="space-between" mt={4}>
            <Button onClick={handlePrevious} isDisabled={activeStep === 0}>
              {t('previous')}
            </Button>
            <Button onClick={handleNext}>
              {activeStep === steps.length - 1 ? t('submit') : t('next')}
            </Button>
          </Flex>
          <Button
  onClick={() => navigate('/signin')} // Use navigate for redirection
  variant="link" // Use "link" for a text-like button appearance
  colorScheme="blue" // You can set a color scheme if needed
  style={{ textTransform: 'none', fontSize: 'inherit', padding: 0, minWidth: 'auto', marginTop: '1rem' }} // Optional: add margin for spacing
>
  {t('SignIn')}
</Button>
          <Text mt={4} textAlign="center">
            {t('step')} {activeStep + 1} {t('of')} {steps.length}
          </Text>
          
        </VStack>
        
      </Box>
      
    </Flex>
  );
};

export default SignUp;
