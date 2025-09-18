import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

// Import translations
import ar from '../locales/ar.json';
import da from '../locales/da.json';
import en from '../locales/en.json';

const STORAGE_KEY = 'selectedLanguage';

// Get stored language
const getStoredLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
    return storedLanguage || 'en';
  } catch (error) {
    console.log('Error retrieving stored language:', error);
    return 'en';
  }
};

// Store language
export const storeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, language);
  } catch (error) {
    console.log('Error storing language:', error);
  }
};

// Handle RTL for Arabic
export const handleRTL = (language: string) => {
  const isRTL = language === 'ar';
  I18nManager.allowRTL(isRTL);
  I18nManager.forceRTL(isRTL);
};

const initI18n = async () => {
  const storedLanguage = await getStoredLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      lng: storedLanguage,
      fallbackLng: 'en',
      debug: __DEV__,
      
      resources: {
        en: { translation: en },
        da: { translation: da },
        ar: { translation: ar },
      },
      
      interpolation: {
        escapeValue: false,
      },
      
      react: {
        useSuspense: false,
      },
    });

  // Set RTL if needed
  handleRTL(storedLanguage);
};

// Change language function
export const changeLanguage = async (language: string) => {
  await storeLanguage(language);
  await i18n.changeLanguage(language);
  handleRTL(language);
};

// Available languages
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

// Initialize i18n
initI18n();

export default i18n; 