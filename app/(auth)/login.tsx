import { Alert } from '@/components/StyledAlert';
// import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiService from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.error(t('common.error'), t('auth.errors.fillAllFields'));
      return;
    }

    setIsLoading(true);
    
    try {
      // Call login API
      const response = await apiService.login(formData);
      
      if (response.success && response.data) {
        // Use auth context to login user
        await login(response.data.user, response.data.token, );
        
        console.log('✅ Login successful');
        
        // Show success message and navigate
        Alert.success(t('common.success'), t('auth.success.loginSuccessful'), () => {
          router.replace('/(tabs)');
        });
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      let errorMessage = t('auth.errors.loginFailed');
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          errorMessage = t('auth.errors.invalidCredentials');
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
            <Ionicons name={"chevron-back"} size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Ionicons name="person" size={40} color="white" />
            </View>
          </View>
          
          <Text style={styles.title}>{t('auth.login.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.login.emailLabel')}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name={"mail"} size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.login.emailPlaceholder')}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.login.passwordLabel')}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.login.passwordPlaceholder')}
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
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>{t('auth.login.forgotPassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingSpinner} />
                <Text style={styles.loginButtonText}>{t('auth.login.signingIn')}</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>{t('auth.login.signIn')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Social Login */}
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

        {/* Sign Up Link */}
        <View style={styles.signupSection}>
          <Text style={styles.signupText}>{t('auth.login.dontHaveAccount')} </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.signupLink}>{t('auth.login.signUp')}</Text>
          </TouchableOpacity>
        </View>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  loginButton: {
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
  loginButtonDisabled: {
    backgroundColor: '#999',
  },
  loginButtonText: {
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
  socialButtonDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  signupText: {
    fontSize: 16,
    color: '#666',
  },
  signupLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
}); 