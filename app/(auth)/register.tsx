import { Alert } from '@/components/StyledAlert';
// import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiService from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Predefined avatar options
  const avatarOptions = [
    { id: 'avatar1', icon: 'person-circle', color: '#007AFF' },
    { id: 'avatar2', icon: 'happy', color: '#34C759' },
    { id: 'avatar3', icon: 'star', color: '#FF9500' },
    { id: 'avatar4', icon: 'heart', color: '#FF3B30' },
    { id: 'avatar5', icon: 'flash', color: '#AF52DE' },
    { id: 'avatar6', icon: 'diamond', color: '#5AC8FA' },
    { id: 'avatar7', icon: 'trophy', color: '#FFCC00' },
    { id: 'avatar8', icon: 'game-controller', color: '#FF6347' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setShowAvatarModal(false);
  };

  const getSelectedAvatarData = () => {
    return avatarOptions.find(avatar => avatar.id === selectedAvatar);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.error(t('common.error'), t('auth.errors.enterFullName'));
      return false;
    }
    if (!formData.email.trim()) {
      Alert.error(t('common.error'), t('auth.errors.enterEmail'));
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.error(t('common.error'), t('auth.errors.validEmail'));
      return false;
    }
    if (formData.password.length < 6) {
      Alert.error(t('common.error'), t('auth.errors.passwordLength'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.error(t('common.error'), t('auth.errors.passwordsMatch'));
      return false;
    }
    if (!agreeToTerms) {
      Alert.error(t('common.error'), t('auth.errors.agreeToTerms'));
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Get selected avatar data
      let avatarData = getSelectedAvatarData();
      if(avatarData === undefined) {
        avatarData = { id: 'avatar1', icon: 'person-circle', color: '#007AFF' }
      }
      
      // Prepare registration data
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        avatar: avatarData || { id: 'avatar1', icon: 'person-circle', color: '#007AFF' }
      };

      console.log(registrationData)

      console.log('🚀 Starting registration process...');
      
      // Call registration API
      const response = await apiService.register(registrationData);
      
      if (response.success && response.data) {
        // Use auth context to login user
        await login(response.data.user, response.data.token);
        
        console.log('✅ Registration successful, user logged in');
        
        // Show success message and navigate
        Alert.success(
          t('common.success'), 
          t('auth.success.accountCreated'),
          () => {
            router.replace('/(tabs)');
          }
        );
      } else {
        throw new Error(response.error || 'Registration failed');
      }
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      let errorMessage = t('auth.errors.registrationFailed');
      
      if (error instanceof Error) {
        // Handle specific error messages
        if (error.message.includes('already exists')) {
          errorMessage = t('auth.errors.emailExists');
        } else if (error.message.includes('Network')) {
          errorMessage = t('auth.errors.networkError');
        } else if (error.message.includes('timeout')) {
          errorMessage = t('auth.errors.timeoutError');
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.error(t('common.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => setShowAvatarModal(true)}
            >
              <View style={[
                styles.logoBackground, 
                selectedAvatar ? { backgroundColor: getSelectedAvatarData()?.color } : null
              ]}>
                <Ionicons 
                  name={selectedAvatar ? getSelectedAvatarData()?.icon as any : "person"} 
                  size={40} 
                  color="white" 
                />
              </View>
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>{t('auth.register.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>
        </View>

        {/* Registration Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.register.fullNameLabel')}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.register.fullNamePlaceholder')}
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.register.emailLabel')}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.register.emailPlaceholder')}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.register.passwordLabel')}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.register.passwordPlaceholder')}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordHint}>{t('auth.register.passwordHint')}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.register.confirmPasswordLabel')}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms Agreement */}
          <TouchableOpacity 
            style={styles.termsContainer}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
              {agreeToTerms && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
            <Text style={styles.termsText}>
              {t('auth.register.agreeToTerms')}{' '}
              <Text style={styles.termsLink}>{t('auth.register.termsOfService')}</Text>
              {' '}{t('auth.register.and')}{' '}
              <Text style={styles.termsLink}>{t('auth.register.privacyPolicy')}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingSpinner} />
                <Text style={styles.registerButtonText}>{t('auth.register.creatingAccount')}</Text>
              </View>
            ) : (
              <Text style={styles.registerButtonText}>{t('auth.register.createAccount')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Social Registration */}
        <View style={styles.socialSection}>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t('auth.login.orContinueWith')}</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton} disabled={true}>
              <Ionicons name="logo-google" size={24} color="#ccc" />
              <Text style={[styles.socialButtonText, { color: '#ccc' }]}>
                {t('auth.login.google')}
              </Text>
            </TouchableOpacity>
            
            {/* <TouchableOpacity style={styles.socialButton} disabled={true}>
              <Ionicons name="logo-apple" size={24} color="#ccc" />
              <Text style={[styles.socialButtonText, { color: '#ccc' }]}>
                {t('auth.login.apple')}
              </Text>
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Login Link */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>{t('auth.register.alreadyHaveAccount')} </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>{t('auth.register.signIn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Selection Modal */}
        <Modal
          visible={showAvatarModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAvatarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('auth.register.chooseAvatar')}</Text>
                <TouchableOpacity 
                  onPress={() => setShowAvatarModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.avatarGrid}>
                {avatarOptions.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarOption,
                      selectedAvatar === avatar.id && styles.avatarOptionSelected
                    ]}
                    onPress={() => handleAvatarSelect(avatar.id)}
                  >
                    <View style={[styles.avatarOptionBackground, { backgroundColor: avatar.color }]}>
                      <Ionicons name={avatar.icon as any} size={32} color="white" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    marginBottom: 24,
    marginTop: 40,
  },
  avatarContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    zIndex: -1,
    borderColor: 'white',
  },
  editAvatarBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  eyeButton: {
    padding: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginLeft: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    backgroundColor: '#999',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
    marginRight: 8,
  },
  socialSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginLeft: 8,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '80%',
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  avatarOption: {
    width: '25%', // 4 columns
    aspectRatio: 1,
    marginVertical: 8,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#007AFF',
  },
  avatarOptionBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 