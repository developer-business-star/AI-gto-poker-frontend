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
import { useTheme } from '@/contexts/ThemeContext';

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
  const { colors, isDark } = useTheme();
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
        style={[
          styles.selectorButton, 
          { 
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          buttonStyle
        ]}
        onPress={showModal}
      >
        <View style={styles.buttonContent}>
          <Text style={[styles.flagText]}>{currentLanguage.flag}</Text>
          <Text style={[
            styles.languageText, 
            { color: colors.text },
            textStyle
          ]}>
            {t(`languages.${currentLanguage.code === 'en' ? 'english' : currentLanguage.code === 'da' ? 'danish' : 'arabic'}`)}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
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
            <View style={[
              styles.modalContent,
              { 
                backgroundColor: colors.card,
                borderColor: colors.border,
              }
            ]}>
              <View style={[
                styles.modalHeader,
                { borderBottomColor: colors.divider }
              ]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('common.language')}</Text>
                <TouchableOpacity 
                  onPress={hideModal} 
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.surface }
                  ]}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.languageList}>
                {LANGUAGES.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageOption,
                      i18n.language === language.code && [
                        styles.selectedLanguageOption,
                        { backgroundColor: colors.primaryLight }
                      ],
                    ]}
                    onPress={() => selectLanguage(language.code)}
                  >
                    <Text style={styles.flagText}>{language.flag}</Text>
                    <Text style={[
                      styles.languageOptionText,
                      { color: colors.text },
                      i18n.language === language.code && [
                        styles.selectedLanguageText,
                        { color: colors.primary }
                      ],
                    ]}>
                      {t(`languages.${language.code === 'en' ? 'english' : language.code === 'da' ? 'danish' : 'arabic'}`)}
                    </Text>
                    {i18n.language === language.code && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
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
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 16,
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
    // backgroundColor will be set dynamically
  },
  languageOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
  },
}); 