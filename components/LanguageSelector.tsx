import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { changeLanguage, LANGUAGES } from '../i18n';

const { width } = Dimensions.get('window');

interface LanguageSelectorProps {
  style?: any;
  buttonStyle?: any;
  textStyle?: any;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  style,
  buttonStyle,
  textStyle,
}) => {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  const showModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  };

  const selectLanguage = async (languageCode: string) => {
    await changeLanguage(languageCode);
    hideModal();
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.selectorButton, buttonStyle]}
        onPress={showModal}
      >
        <View style={styles.buttonContent}>
          <Text style={[styles.flagText]}>{currentLanguage.flag}</Text>
          <Text style={[styles.languageText, textStyle]}>
            {t(`languages.${currentLanguage.code === 'en' ? 'english' : currentLanguage.code === 'da' ? 'danish' : 'arabic'}`)}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </View>
      </TouchableOpacity>

      <Modal
        transparent
        visible={modalVisible}
        animationType="none"
        onRequestClose={hideModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={hideModal}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('common.language')}</Text>
                <TouchableOpacity onPress={hideModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.languageList}>
                {LANGUAGES.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageOption,
                      i18n.language === language.code && styles.selectedLanguageOption,
                    ]}
                    onPress={() => selectLanguage(language.code)}
                  >
                    <Text style={styles.flagText}>{language.flag}</Text>
                    <Text style={[
                      styles.languageOptionText,
                      i18n.language === language.code && styles.selectedLanguageText,
                    ]}>
                      {t(`languages.${language.code === 'en' ? 'english' : language.code === 'da' ? 'danish' : 'arabic'}`)}
                    </Text>
                    {i18n.language === language.code && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  selectorButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagText: {
    fontSize: 18,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width * 0.8,
    maxWidth: 300,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    backdropFilter: 'blur(10px)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  languageList: {
    gap: 4,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  selectedLanguageOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  languageOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectedLanguageText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 