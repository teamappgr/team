// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      firstName: "First Name",
      lastName: "Last Name",
      phone: "Phone",
      signIn: "Sign in",
      email: "Email Address",
      password: "Password",
      forgotPassword: "Forgot password?",
      dontHaveAccount: "Don't have an account? Sign Up",
      skip: "Skip",
      copyright: "Copyright © Your Website",
      loading: "Loading...",
      networkError: "Unable to connect to the server. Please try again later.",
      userIdError: "Error signing in",
      signUp: "Sign Up",
      contactInfo: "Contact Info",
      fillContactInfo: "Fill out your name, email, and phone number.",
      uploadImage: "Upload Image",
      uploadImageDescription: "Upload a profile picture.",
      instagramInfo: "Instagram Info",
      enterInstagramInfo: "Enter your Instagram account and password.",
      missingFields: "Please fill in all required fields before proceeding.",
      step: "Step",
      of: "of",
      next: "Next",
      submit: "Submit",
      update: "Update",
      previous: "Previous",
      alreadyHaveAccount: "Already have an account? Sign in",
      selectUniversity: "Select University",
      acceptTerms: "I accept the Terms and Conditions",
      invalidEmail: "Invalid Email",
      invalidEmailDescription: "Please use an email that ends with @example.com."
    },
  },
  el: { // Greek translations
    translation: {
      firstName: "Όνομα",
      lastName: "Επίθετο",
      phone: "Τηλέφωνο",
      signIn: "Σύνδεση",
      email: "Διεύθυνση Email",
      password: "Κωδικός Πρόσβασης",
      forgotPassword: "Ξεχάσατε τον κωδικό πρόσβασης;",
      dontHaveAccount: "Δεν έχετε λογαριασμό; Εγγραφή",
      skip: "Παράλειψη",
      copyright: "Πνευματικά Δικαιώματα © Η Ιστοσελίδα σας",
      loading: "Φόρτωση...",
      networkError: "Αδυναμία σύνδεσης με τον διακομιστή. Δοκιμάστε ξανά αργότερα.",
      userIdError: "Σφάλμα κατά την σύνδεση",
      signUp: "Εγγραφή",
      contactInfo: "Στοιχεία Επικοινωνίας",
      fillContactInfo: "Συμπληρώστε το όνομα, το email και τον αριθμό τηλεφώνου.",
      uploadImage: "Ανέβασμα Εικόνας",
      uploadImageDescription: "Ανεβάστε μια φωτογραφία προφίλ.",
      instagramInfo: "Πληροφορίες Instagram",
      enterInstagramInfo: "Εισάγετε το Instagram σας και τον κωδικό πρόσβασης.",
      missingFields: "Συμπληρώστε όλα τα απαιτούμενα πεδία πριν προχωρήσετε.",
      step: "Βήμα",
      of: "από",
      next: "Επόμενο",
      submit: "Υποβολή",
      update: "Ενημέρωση",
      previous: "Προηγούμενο",
      alreadyHaveAccount: "Έχετε ήδη λογαριασμό; Συνδεθείτε",
      selectUniversity: "Επιλέξτε Πανεπιστήμιο",
      acceptTerms: "Αποδέχομαι τους Όρους και Προϋποθέσεις",
      invalidEmail: "Μη έγκυρο Email",
      invalidEmailDescription: "Παρακαλώ χρησιμοποιήστε ένα email που τελειώνει σε @example.com."
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'el', // Default language set to Greek
    fallbackLng: 'en', // Use English as a fallback
    interpolation: {
      escapeValue: false, // React already safeguards against XSS
    },
  });

export default i18n;
