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
  Spinner,
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
import backround from './backimg.jpeg'; // Correct import
import Visibility from '@mui/icons-material/Visibility'; // Import Visibility icon
import VisibilityOff from '@mui/icons-material/VisibilityOff'; // Import VisibilityOff icon


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
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // For camera-captured image
  const [uploadedImage, setUploadedImage] = useState<File | null>(null); // For file-uploaded image
  const [cameraMode, setCameraMode] = useState<'user' | 'environment'>('user'); // New state for camera mode

  useEffect(() => {
    const userId = Cookies.get('userId');
    if (userId) {
      navigate('/');
    }
  }, [navigate]);
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
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
    gender: '',
  });

  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleInputChange('gender', e.target.value);
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUniversity(e.target.value);
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermsAccepted(e.target.checked);
  };

// Define the type for the response from the email check API
interface CheckEmailResponse {
  exists: boolean;
}

// The validateFields function
const validateFields = async () => {
  const { firstName, lastName, email, phone, instagramAccount, password, gender } = formData;

  // Step 1: Validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    toast({
      title: t('invalidEmail'),
      description: t('invalidEmailDescription'),
      status: 'error',
      duration: 4000,
      isClosable: true,
    });
    return false; // Do not proceed to the next step
  }

  // Step 2: Check if the email is already registered
  const emailExists = await checkEmailExists(email); // Async call to the backend
  if (emailExists) {
    toast({
      title: t('emailAlreadyExists'),
      description: t('emailAlreadyExistsDescription'),
      status: 'error',
      duration: 4000,
      isClosable: true,
    });
    return false; // Do not proceed to the next step
  }

  // Step 3: Validate phone number
  if (!/^69\d{8}$/.test(phone)) {
    toast({
      title: t('invalidPhone'),
      description: t('invalidPhoneDescription'),
      status: 'error',
      duration: 4000,
      isClosable: true,
    });
    return false; // Do not proceed to the next step
  }

  // Step 4: Ensure all required fields are filled
  if (!firstName || !lastName || !email || !phone) {
    toast({
      title: t('missingFields'),
      description: t('missingFieldsDescription'),
      status: 'error',
      duration: 4000,
      isClosable: true,
    });
    return false; // Do not proceed to the next step
  }

  // Step 5: Handle additional steps
  if (activeStep === 1) {
    if ((capturedImage === null && uploadedImage === null) || selectedUniversity === null) {
      toast({
        title: t('missingUniversityOrImage'),
        description: t('missingUniversityOrImageDescription'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return false; // Do not proceed to the next step
    }
  } else if (activeStep === 2) {
    if (!instagramAccount || !password || !termsAccepted || !gender) {
      toast({
        title: t('missingFinalFields'),
        description: t('missingFinalFieldsDescription'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return false; // Do not proceed to the next step
    }
  }

  // If all validations pass
  return true; 
};

// Async function to check if the email exists in the database
const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API}check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result: CheckEmailResponse = await response.json(); // Use the defined type here
    return result.exists; // Assuming the backend returns { exists: true } if the email is in the database
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
};

// The function to handle moving to the next step
const handleNextStep = async () => {
  const isValid = await validateFields(); // Wait for validation to complete
  if (isValid) {
    // Proceed to the next step if validation passes
    setActiveStep((prev) => prev + 1);
  } else {
    console.log('Validation failed. Cannot proceed to the next step.');
  }
};

// Your component's button to go to the next step
<button onClick={handleNextStep}>Next</button>

  

const handleNext = async () => {
  // Set loading state to true while checking email
  setIsLoading(true); 

  // Perform validation and wait for the result
  const isValid = await validateFields();
  
  if (!isValid) {
    toast({
      title: t('missingFields'),
      description: t('missingFields'),
      status: 'error',
      duration: 4000,
      isClosable: true,
    });
    setIsLoading(false); // Stop loading if validation fails
    return; // Do not proceed to the next step if validation fails
  }

  // If not on the last step, move to the next step
  if (activeStep < steps.length - 1) {
    setActiveStep((prev) => prev + 1);
  } 
  // Handle form submission when it's the last step
  else {
    try {
      await handleSubmit(); // Make sure handleSubmit is an async function
      toast({
        title: t('submitSuccess'),
        description: t('formSubmitted'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: t('submitError'),
        description: t('submissionFailed'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false); // Stop loading spinner after submission is complete
    }
  }
  setIsLoading(false); // Stop loading spinner after submission is complete

};





  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };
  const urlB64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
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
        return; // Stop further execution if validation fails
    }

    // Existing code to handle form submission...
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('firstName', formData.firstName);
    formDataToSubmit.append('lastName', formData.lastName);
    formDataToSubmit.append('email', formData.email);
    formDataToSubmit.append('phone', formData.phone);
    formDataToSubmit.append('gender', formData.gender); // Ensure gender is appended

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
        const userId: string = result.userId;       // Retrieve userId
        const encryptedCode: string = result.encryptedCode; // Retrieve encrypted code from backend
    
        // Set the `userId` cookie to the encrypted code directly
        Cookies.set('userId', encryptedCode, { expires: 14 }); // Set the encrypted code in the cookie
    
        console.log('User signed up successfully:', result);
    
        // Proceed to subscribe to push notifications
        await subscribeUserToPushNotifications(userId);
    
        // Navigate to the /team route
        navigate('/');
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

// Function to handle push subscription
const subscribeUserToPushNotifications = async (userId: string) => { // Explicitly define userId type
    console.log('Attempting to subscribe...');

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            // Register the service worker
            const registration = await navigator.serviceWorker.register('service-worker.js');
            console.log('Service Worker registered:', registration);

            // Check if push manager is available and service worker is active
            const existingSubscription = await registration.pushManager.getSubscription();

            // If there's an existing subscription, unsubscribe from it
            if (existingSubscription) {
                await existingSubscription.unsubscribe();
                console.log('Unsubscribed from existing subscription.');
            }

            // Retrieve the VAPID public key from environment variables
            const applicationServerKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
            if (!applicationServerKey) {
                console.error('VAPID public key is not defined.');
                return;
            }

            // Convert the VAPID public key to the required Uint8Array format
            const convertedVapidKey = urlB64ToUint8Array(applicationServerKey);

            // Subscribe to push notifications using the converted VAPID public key
            const newSubscription: PushSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
            });
            console.log('Subscription request sent:', newSubscription);
            const userId = Cookies.get('userId'); // Get the userId from the cookies

            // Send the subscription to the backend
            const response = await fetch(`${process.env.REACT_APP_API}subscribe/${userId}`, {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId, // Pass the userId here
                    endpoint: newSubscription.endpoint,
                    keys: newSubscription.toJSON().keys, // Ensure keys are sent as JSON
                }),
            });

            // Handle the response from the backend
            if (!response.ok) {
                const errorMessage = await response.json();
                console.error('Failed to subscribe:', errorMessage);
            } else {
                console.log('Subscription successful!');
            }
        } catch (error) {
            console.error('Subscription error:', error);
        }
    } else {
        console.error('Service workers or Push notifications are not supported in this browser.');
    }
};



const openCamera = async () => {
  setIsCameraOpen(true);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: cameraMode } }, // Use cameraMode state
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

const switchCamera = () => {
  // Switch between 'user' (front) and 'environment' (back) camera modes
  const newMode = cameraMode === 'user' ? 'environment' : 'user';
  setCameraMode(newMode);
  closeCamera(); // Close the current camera stream
  openCamera(); // Open the camera with the new mode
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
        <VStack spacing={0} align="stretch">
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
                <Box flexShrink="0" width="100%" maxWidth="300px">
      <Box textAlign="left" whiteSpace="normal" wordBreak="break-word">
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
                        <Button onClick={switchCamera} mt={3} ml={3}>
                          {t('switchCamera')}
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
                  <option value="Pan. Pireos">Πανεπηστήμειο Πειραιώς</option>
                  {/* <option value="Pan. Dit. Attikis">Π.Α.Δ.Α</option> */}
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
<Box display="flex" alignItems="center" mb={3}>
  <Input
    placeholder={t('password')}
    type={showPassword ? 'text' : 'password'} // Toggle input type
    value={formData.password}
    onChange={(e) => handleInputChange('password', e.target.value)}
    required
    flex="1" // Allow input to take available space
    mr={2} // Margin to the right of the input
  />
  <Button onClick={handleTogglePasswordVisibility} style={{ padding: 0 }}>
    {showPassword ? <VisibilityOff /> : <Visibility />} {/* Toggle icon */}
  </Button>
</Box>
                <Select placeholder={t('selectGender')} onChange={handleGenderChange}>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
              </Select>
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
            <Button
  onClick={handleNext}
  isLoading={isLoading} // Show spinner while submitting
  spinner={<Spinner />} // Custom spinner can be used
  isDisabled={isLoading} // Disable button while loading
>
  {activeStep === steps.length - 1 ? t('submit') : t('next')}
</Button>
          </Flex>
          <Button
  onClick={() => navigate('/signin')} // Use navigate for redirection
  variant="link" // Use "link" for a text-like button appearance
  colorScheme="blue" // You can set a color scheme if needed
  style={{ textTransform: 'none', fontSize: 'inherit', padding: 0, minWidth: 'auto', marginTop: '1rem' }} // Optional: add margin for spacing
>
  {t('signIn')}
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
