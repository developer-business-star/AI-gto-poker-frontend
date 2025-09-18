import { ThemedView } from '@/components/ThemedView';
import API_CONFIG from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import ApiService from '@/services/apiService';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CameraCapturedPicture, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Button, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const { selectedFormat, formatDisplayName } = useGame();
  const { user } = useAuth();
  const [autoCapture, setAutoCapture] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [analysisStats, setAnalysisStats] = useState<{
    avgProcessingTime: string;
    avgConfidence: number;
    maxDecisions: number;
    totalAnalyses: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const countdownAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Camera state management
  const [cameraKey, setCameraKey] = useState(0); // Force camera re-render
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [shouldRequestPermission, setShouldRequestPermission] = useState(false);

  // Custom modal state
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    message: string;
    recommendedAction: string;
    totalTime: string;
    processingTime?: string;
    source: string;
  } | null>(null);
  
  // General modal state
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [generalModalData, setGeneralModalData] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'primary' | 'secondary' | 'destructive';
    }>;
  } | null>(null);

  // Test backend connection on component mount
  useEffect(() => {
    testBackendConnection();
  }, []);

  // Fetch analysis stats when backend connects
  useEffect(() => {
    if (isBackendConnected === true) {
      fetchAnalysisStats();
    }
  }, [isBackendConnected]);

  const fetchAnalysisStats = async () => {
    try {
      setIsLoadingStats(true);
      console.log('📊 Fetching analysis statistics...');
      const statsResponse = await ApiService.getAnalysisStats();

      if (statsResponse.success && statsResponse.stats) {
        setAnalysisStats(statsResponse.stats);
        console.log('✅ Analysis stats updated:', statsResponse.stats);
      }
    } catch (error) {
      console.error('❌ Failed to fetch analysis stats:', error);
      // Don't show error to user, just use default values
    } finally {
      setIsLoadingStats(false);
    }
  };

  const showCustomModal = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'primary' | 'secondary' | 'destructive';
    }>
  ) => {
    setGeneralModalData({
      title,
      message,
      type,
      buttons
    });
    setShowGeneralModal(true);
  };

  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing backend connection...');
      console.log('📡 API Config:', API_CONFIG.DEBUG);

      const isConnected = await ApiService.testConnection();
      setIsBackendConnected(isConnected);

      if (!isConnected) {
        showCustomModal(
          'Backend Connection Failed',
          `Cannot connect to the analysis server.\n\nTroubleshooting:\n• Make sure backend is running: npm run dev\n• Check URL: ${API_CONFIG.BASE_URL}\n• Platform: ${API_CONFIG.DEBUG.PLATFORM}\n\nUsing offline mode for now.`,
          'error',
          [
            { text: 'Retry', onPress: () => testBackendConnection(), style: 'primary' },
            { text: 'Use Offline', style: 'secondary' }
          ]
        );
      } else {
        showCustomModal(
          'Backend Connected',
          'Successfully connected to the analysis server!',
          'success',
          [{ text: 'OK', style: 'primary' }]
        );
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsBackendConnected(false);

      showCustomModal(
        'Connection Error',
        `Failed to test backend connection.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check if your backend server is running on port 3001.`,
        'error',
        [
          { text: 'Retry', onPress: () => testBackendConnection(), style: 'primary' },
          { text: 'Cancel', style: 'secondary' }
        ]
      );
    }
  };

  const handleImageUpload = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showCustomModal(
          'Permission Required',
          'Please grant permission to access your photo library to upload poker table images.',
          'warning',
          [{ text: 'OK', style: 'primary' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: API_CONFIG.IMAGE.ASPECT_RATIO,
        quality: API_CONFIG.IMAGE.QUALITY,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);

        // Check backend connection before analysis
        if (isBackendConnected === false) {
          showCustomModal(
            'Backend Offline',
            'Analysis server is not available. Would you like to try offline analysis or retry connection?',
            'warning',
            [
              // { text: 'Offline Analysis', onPress: () => analyzeImageOffline() },
              { text: 'Retry Connection', onPress: () => testBackendConnection(), style: 'primary' },
              { text: 'Cancel', style: 'secondary' }
            ]
          );
          return;
        }

        await analyzeImageWithBackend(imageUri, "");
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showCustomModal(
        'Upload Error',
        'Failed to select image. Please try again.',
        'error',
        [{ text: 'OK', style: 'primary' }]
      );
    }
  };

  const analyzeImageWithBackend = async (imageUri: string, source: string) => {
    try {
      // Start loading modal
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setAnalysisStage('Initializing analysis...');

      // Start timing the analysis
      const analysisStartTime = Date.now();

      // Convert selectedFormat to backend format
      const gameFormat = selectedFormat === 'cash' ? 'cash' : 'tournament';

      console.log(`🎯 Starting ${gameFormat} analysis for image: ${imageUri}`);
      if (user) {
        console.log(`👤 User: ${user.fullName} (${user.email})`);
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev < 90) {
            return prev + Math.random() * 15;
          }
          return prev;
        });
      }, 500);

      // Update analysis stages
      setTimeout(() => setAnalysisStage('Processing image...'), 1000);
      setTimeout(() => setAnalysisStage('Analyzing table layout...'), 2000);
      setTimeout(() => setAnalysisStage('Calculating GTO decisions...'), 4000);
      setTimeout(() => setAnalysisStage('Finalizing analysis...'), 6000);

      // Step 1: Upload image to backend with user information
      const uploadResponse = await ApiService.uploadImageForAnalysis(imageUri, gameFormat, user || undefined);

      if (!uploadResponse.success) {
        throw new Error('Failed to upload image');
      }

      setAnalysisId(uploadResponse.analysisId);

      // Complete progress
      setAnalysisProgress(100);
      setAnalysisStage('Analysis complete!');

      // Clear progress interval
      clearInterval(progressInterval);

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Calculate total analysis time
      const analysisEndTime = Date.now();
      const totalAnalysisTime = analysisEndTime - analysisStartTime;
      const totalAnalysisTimeSeconds = (totalAnalysisTime / 1000).toFixed(2);

      console.log(`⏱️ Total analysis time: ${totalAnalysisTimeSeconds} seconds`);
      if (uploadResponse.processingTime) {
        console.log(`⚡ Backend processing time: ${uploadResponse.processingTime} seconds`);
      }

      // Refresh analysis statistics after successful analysis
      await fetchAnalysisStats();

      // Close loading modal
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisStage('');

      // Show custom modal instead of Alert.alert
      setAnalysisResult({
        title: `Analysis ${gameFormat} Result`,
        message: uploadResponse.analysisNotes,
        recommendedAction: uploadResponse.recommenedeAction,
        totalTime: totalAnalysisTimeSeconds,
        processingTime: uploadResponse.processingTime,
        source: source
      });
      setShowAnalysisModal(true);

    } catch (error) {
      console.error('❌ Backend analysis error:', error);

      // Clear progress interval and close loading modal
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisStage('');

      // Offer fallback to offline analysis
      showCustomModal(
        'Analysis Error',
        `${error instanceof Error ? error.message : 'Failed to analyze image'}\n\nWould you like to try offline analysis instead?`,
        'error',
        [
          { text: 'Retry', onPress: () => analyzeImageWithBackend(imageUri, ""), style: 'primary' },
          { text: 'Cancel', style: 'secondary' }
        ]
      );
    }
  };

  const animateCountdown = (number: number) => {
    // Reset animations
    scaleAnimation.setValue(0.5);
    opacityAnimation.setValue(0);
    pulseAnimation.setValue(1);
    
    // Start pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Animate in
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate out
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 0.7,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const toggleAutoCapture = () => {
    setAutoCapture(!autoCapture);
    // Start countdown display
    setShowCountdown(true);
    setCountdownNumber(3);
    
    // Initial animation
    animateCountdown(3);
    
    // Countdown timer with animations
    const countdownInterval = setInterval(() => {
      setCountdownNumber((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Final animation before hiding
          Animated.timing(opacityAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setShowCountdown(false);
            scaleAnimation.setValue(1);
            opacityAnimation.setValue(1);
            pulseAnimation.setValue(1);
          });
          return 3;
        }
        const newNumber = prev - 1;
        animateCountdown(newNumber);
        return newNumber;
      });
    }, 1000);

    // Original functionality after 3 seconds
    setTimeout(() => {
      setAutoCapture(!autoCapture);
      takePicture("autoCapture");
    }, 3000);
  };

  const getFormatColor = () => {
    return selectedFormat === 'cash' ? '#1a73e8' : '#ea4335';
  };

  const getFormatIcon = () => {
    return selectedFormat === 'cash' ? 'cash' : 'trophy';
  };

  {/*Camera View*/ }
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  
  // Get camera permissions from hook but control when they're active
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  
  // Local state to control permission availability - only active on Solver page
  const [permission, setPermission] = useState<any>(null);
  
  // requestPermission is only available when on Solver page (screen focused)
  const requestPermission = isScreenFocused ? requestCameraPermission : null;

  // Handle camera permissions and state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 Solver page focused - reloading camera permissions");
      
      // Set screen as focused
      setIsScreenFocused(true);
      
      // Activate camera permissions only on Solver page
      console.log("📱 Activating camera permissions for Solver page...");
      console.log("📱 Current camera permission state:", cameraPermission);
      setPermission(cameraPermission);
      
      // Request camera permission when entering Solver page if not already granted
      if (!cameraPermission?.granted) {
        console.log("📱 Requesting camera permission on Solver page focus...");
        requestCameraPermission().then((result) => {
          console.log("📱 Permission request result:", result);
          setPermission(result);
        }).catch((error) => {
          console.error("❌ Permission request failed:", error);
          setPermission({granted: false});
        });
      } else {
        console.log("📱 Camera permission already granted");
      }
      
      // Reset camera state
      setPhotoUri(null);
      setFacing('back');
      setAutoCapture(false);
      setShowCountdown(false);
      setCountdownNumber(3);
      setIsCameraReady(false);
      
      // Reset animations
      scaleAnimation.setValue(1);
      opacityAnimation.setValue(1);
      pulseAnimation.setValue(1);
      
      // Force camera re-render by changing key
      setCameraKey(prev => prev + 1);
      
      // Test backend connection
      testBackendConnection();
      
      // Fetch latest stats
      if (isBackendConnected === true) {
        fetchAnalysisStats();
      }
      
      // Return cleanup function for when screen loses focus
      return () => {
        console.log("🔄 Solver page losing focus - cleaning up camera state");
        console.log("📱 Resetting permission state to null");
        setIsScreenFocused(false);
        setIsCameraReady(false);
        
        // Reset permission to null when leaving Solver page
        setPermission(null);
      };
    }, [cameraPermission, requestCameraPermission])
  );

  // Add useEffect to sync permission state when camera permission changes
  useEffect(() => {
    if (isScreenFocused && cameraPermission) {
      console.log("📱 Syncing permission state - camera permission changed:", cameraPermission);
      setPermission(cameraPermission);
    }
  }, [cameraPermission, isScreenFocused]);

  useEffect(() => {
    console.log("📱 Permission state:", permission)
    console.log("📱 Screen focused:", isScreenFocused)
    console.log("📱 requestPermission function available:", requestPermission !== null)
    console.log("📱 Permission is null on other pages:", !isScreenFocused && permission === null)
    console.log("📱 requestPermission is null on other pages:", !isScreenFocused && requestPermission === null)
  }, [permission, isScreenFocused, requestPermission]);
  
  // Show loading when permission is null (not on Solver page)
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: '#666' }}>
          {isScreenFocused ? 'Loading camera...' : 'Navigate to Solver to use camera'}
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button 
          onPress={() => {
            console.log("📱 Permission button pressed - requestPermission available:", requestPermission !== null);
            if (requestPermission) {
              console.log("📱 Calling requestPermission on Solver page");
              requestPermission();
            } else {
              console.log("❌ requestPermission not available - not on Solver page");
            }
          }} 
          title="Grant Permission" 
        />
      </View>
    );
  }

  const takePicture = async (source: string) => {
    if (source === "autoCapture") {
      setAutoCapture(false);
    }

    if (cameraRef.current) {
      try {
        const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
          skipProcessing: true
        });

        setPhotoUri(photo.uri);
        console.log("Captured photo URI:", photo.uri);

        if (isBackendConnected === true) {
          await analyzeImageWithBackend(photo.uri, source);
        }

        reloadPage();
      } catch (err) {
        console.error("Error taking picture:", err);
        showCustomModal(
          'Camera Error',
          'Failed to take photo. Please try again.',
          'error',
          [{ text: 'OK', style: 'primary' }]
        );
      }
    } else {
      console.warn("Camera ref is not ready yet");
      showCustomModal(
        'Camera Not Ready',
        'Please wait for the camera to initialize.',
        'warning',
        [{ text: 'OK', style: 'primary' }]
      );
    }

  };

  const reloadPage = () => {
    setPhotoUri(null);
    setFacing('back');
  };
  return (
    <ThemedView style={styles.container}>
      {/* Header with Format Display */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoBackground, { backgroundColor: getFormatColor() }]}>
            <MaterialIcons name="memory" size={40} color="white" />
          </View>
        </View>

        <Text style={styles.title}>GTO Solver</Text>
        <Text style={styles.subtitle}>Real-time poker analysis</Text>

        <View style={styles.formatIndicatorMiddle}>
          {/* Current Format Indicator */}
          <View style={[styles.formatIndicator, { backgroundColor: getFormatColor() }]}>
            <Ionicons name={getFormatIcon() as any} size={16} color="white" />
            <Text style={styles.formatText}>{formatDisplayName} Mode</Text>
          </View>

          {/* Backend Connection Status */}
          <View style={[styles.connectionStatus, {
            backgroundColor: isBackendConnected === true ? '#22c55e' :
              isBackendConnected === false ? '#ef4444' : '#f59e0b'
          }]}>
            <Ionicons
              name={isBackendConnected === true ? "cloud-done" :
                isBackendConnected === false ? "cloud-offline" : "cloud"}
              size={14}
              color="white"
            />
            <Text style={styles.connectionText}>
              {isBackendConnected === true ? 'Online Analysis' :
                isBackendConnected === false ? 'Offline Mode' : 'Connecting...'}
            </Text>
            {isBackendConnected === false && (
              <TouchableOpacity onPress={testBackendConnection} style={styles.retryButton}>
                <Ionicons name="refresh" size={14} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/*Camera View*/}
      <View style={styles.CameraViewContainer}>
        {permission?.granted ? (
          <CameraView 
            key={cameraKey} // Force re-render when key changes
            style={styles.camera} 
            facing={facing} 
            ref={cameraRef}
            onCameraReady={() => {
              console.log("📱 Camera is ready and initialized");
              setIsCameraReady(true);
            }}
            onMountError={(error) => {
              console.error(" Camera mount error:", error);
              setIsCameraReady(false);
            }}
          >
            <View style={[styles.overlayFrame, { borderColor: getFormatColor() }]}>
              <View style={[styles.cornerTopLeft, { borderColor: getFormatColor() }]} />
              <View style={[styles.cornerTopRight, { borderColor: getFormatColor() }]} />
              <View style={[styles.cornerBottomLeft, { borderColor: getFormatColor() }]} />
              <View style={[styles.cornerBottomRight, { borderColor: getFormatColor() }]} />
            </View>
            <View style={styles.simulatedTable}>
              <Text style={[styles.tableText, { color: getFormatColor() }]} >🎰 Poker Table View</Text>
            </View>

            {/* Countdown Overlay */}
            {showCountdown && (
              <View style={styles.countdownOverlay}>
                <Animated.View style={[
                  styles.countdownContainer,
                  {
                    transform: [{ scale: scaleAnimation }],
                    opacity: opacityAnimation,
                  }
                ]}>
                  <Text style={styles.countdownText}>{countdownNumber}</Text>
                  <Animated.View style={[
                    styles.countdownPulse,
                    {
                      transform: [{ scale: pulseAnimation }],
                    }
                  ]} />
                </Animated.View>
              </View>
            )}
          </CameraView>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraPlaceholderText}>Camera permission required</Text>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={() => {
                console.log("📱 Camera placeholder permission button pressed");
                console.log("📱 requestPermission available:", requestPermission !== null);
                if (requestPermission) {
                  console.log("📱 Calling requestPermission on Solver page");
                  requestPermission();
                } else {
                  console.log("❌ requestPermission not available - not on Solver page");
                }
              }}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleImageUpload}
          >
            <Ionicons name="images" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              { backgroundColor: getFormatColor() },
              autoCapture && { ...styles.autoButtonActive, backgroundColor: getFormatColor() },
              !isCameraReady && styles.captureButtonDisabled,
            ]}
            onPress={toggleAutoCapture}
            disabled={!isCameraReady}
          >
            <View style={styles.captureInner}>
              <Ionicons
                name={autoCapture ? "stop-circle" : "play-circle"}
                size={27}
                color={autoCapture ? "white" : "white"}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              { backgroundColor: getFormatColor() },
              !isCameraReady && styles.captureButtonDisabled,
            ]}
            onPress={() => takePicture("")}
            disabled={!isCameraReady}
          >
            <View style={styles.captureInner}>
              <Ionicons name="camera" size={27} color="white" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Format-Specific Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statsHeader}>
          <View style={styles.statsTitleContainer}>
            <Text style={styles.statsTitle}>Analysis Statistics</Text>
            {analysisStats && (
              <Text style={styles.statsSubtitle}>
                Based on {analysisStats.totalAnalyses} analyses
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={fetchAnalysisStats}
            style={[
              styles.refreshStatsButton,
              isLoadingStats && styles.refreshStatsButtonLoading
            ]}
            disabled={isLoadingStats}
          >
            <Ionicons
              name={isLoadingStats ? "sync" : "refresh"}
              size={20}
              color={isLoadingStats ? "#999" : "#007AFF"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContent}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={22} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>
              {isLoadingStats && !analysisStats ? '...' :
                analysisStats ? `${analysisStats.avgProcessingTime}s` : '--'}
            </Text>
            <Text style={styles.statLabel}>Avg Analysis</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={22} color="#34C759" />
            </View>
            <Text style={styles.statValue}>
              {isLoadingStats && !analysisStats ? '...' :
                analysisStats ? `${analysisStats.avgConfidence}%` : '--'}
            </Text>
            <Text style={styles.statLabel}>Recognition</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="analytics" size={22} color="#FF9500" />
            </View>
            <Text style={styles.statValue}>
              {isLoadingStats && !analysisStats ? '...' :
                analysisStats ? analysisStats.maxDecisions : '--'}
            </Text>
            <Text style={styles.statLabel}>
              {selectedFormat === 'cash' ? 'Decisions' : 'Push/Folds'}
            </Text>
          </View>
        </View>
      </View>

      {/* Analysis Loading Modal */}
      <Modal
        visible={isAnalyzing}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModalContainer}>
            {/* Header with Format Info */}
            <View style={styles.loadingModalHeader}>
              <View style={[styles.loadingModalLogo, { backgroundColor: getFormatColor() }]}>
                <MaterialIcons name="memory" size={32} color="white" />
              </View>
              <Text style={styles.loadingModalTitle}>GTO Analysis</Text>
              <Text style={styles.loadingModalSubtitle}>{formatDisplayName} Mode</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${analysisProgress}%`,
                      backgroundColor: getFormatColor()
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(analysisProgress)}%</Text>
            </View>

            {/* Current Stage */}
            <View style={styles.stageContainer}>
              <ActivityIndicator
                size="small"
                color={getFormatColor()}
                style={styles.stageSpinner}
              />
              <Text style={styles.stageText}>{analysisStage}</Text>
            </View>

            {/* Analysis Steps */}
            <View style={styles.analysisSteps}>
              <View style={styles.stepItem}>
                <View style={[styles.stepIcon, { backgroundColor: analysisProgress > 20 ? getFormatColor() : '#333' }]}>
                  <Ionicons name="image" size={16} color="white" />
                </View>
                <Text style={[styles.stepText, { color: analysisProgress > 20 ? 'white' : '#666' }]}>
                  Processing
                </Text>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepIcon, { backgroundColor: analysisProgress > 40 ? getFormatColor() : '#333' }]}>
                  <Ionicons name="grid" size={16} color="white" />
                </View>
                <Text style={[styles.stepText, { color: analysisProgress > 40 ? 'white' : '#666' }]}>
                  Table
                </Text>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepIcon, { backgroundColor: analysisProgress > 70 ? getFormatColor() : '#333' }]}>
                  <Ionicons name="calculator" size={16} color="white" />
                </View>
                <Text style={[styles.stepText, { color: analysisProgress > 70 ? 'white' : '#666' }]}>
                  Calculation
                </Text>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepIcon, { backgroundColor: analysisProgress > 90 ? getFormatColor() : '#333' }]}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
                <Text style={[styles.stepText, { color: analysisProgress > 90 ? 'white' : '#666' }]}>
                  Finalizing
                </Text>
              </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelAnalysisButton}
              onPress={() => {
                setIsAnalyzing(false);
                setAnalysisProgress(0);
                setAnalysisStage('');
              }}
            >
              <Text style={styles.cancelAnalysisText}>Cancel Analysis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Analysis Result Modal */}
      <Modal
        visible={showAnalysisModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{analysisResult?.title}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAnalysisModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>{analysisResult?.message}</Text>
              
              <View style={styles.modalMetrics}>
                <View style={styles.metricItem}>
                  <Ionicons name="time" size={16} color="#007AFF" />
                  <Text style={styles.metricText}>Total time: {analysisResult?.totalTime}s</Text>
                </View>
                {analysisResult?.processingTime && (
                  <View style={styles.metricItem}>
                    <Ionicons name="flash" size={16} color="#FF9500" />
                    <Text style={styles.metricText}>Processing: {analysisResult.processingTime}s</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.modalButtons}>
              {analysisResult?.source === "autoCapture" ? (
                <>
                  <TouchableOpacity
                    style={styles.recommendedButton}
                    onPress={() => {
                      setShowAnalysisModal(false);
                      toggleAutoCapture();
                    }}
                  >
                    <Text style={styles.recommendedButtonText}>{analysisResult.recommendedAction}</Text>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelModalButton}
                    onPress={() => {
                      setShowAnalysisModal(false);
                      setAutoCapture(false);
                    }}
                  >
                    <Text style={styles.cancelModalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.singleActionButton}
                  onPress={() => setShowAnalysisModal(false)}
                >
                  <Text style={styles.singleActionButtonText}>{analysisResult?.recommendedAction}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* General Custom Modal */}
      <Modal
        visible={showGeneralModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGeneralModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons 
                  name={
                    generalModalData?.type === 'success' ? 'checkmark-circle' :
                    generalModalData?.type === 'error' ? 'close-circle' :
                    generalModalData?.type === 'warning' ? 'warning' : 'information-circle'
                  } 
                  size={24} 
                  color={
                    generalModalData?.type === 'success' ? '#22c55e' :
                    generalModalData?.type === 'error' ? '#ef4444' :
                    generalModalData?.type === 'warning' ? '#f59e0b' : '#007AFF'
                  } 
                />
              </View>
              <Text style={styles.modalTitle}>{generalModalData?.title}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowGeneralModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>{generalModalData?.message}</Text>
            </View>

            <View style={styles.modalButtons}>
              {generalModalData?.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.generalModalButton,
                    button.style === 'primary' && styles.primaryButton,
                    button.style === 'secondary' && styles.secondaryButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    generalModalData.buttons.length === 1 && styles.singleButton,
                  ]}
                  onPress={() => {
                    button.onPress?.();
                    setShowGeneralModal(false);
                  }}
                >
                  <Text style={[
                    styles.generalModalButtonText,
                    button.style === 'primary' && styles.primaryButtonText,
                    button.style === 'secondary' && styles.secondaryButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  CameraViewContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 15
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
    alignSelf: 'flex-end', // Position button at the bottom
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  preview: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
  },
  formatIndicatorMiddle: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    width: '100%',
    justifyContent: 'space-between'
  },
  formatIndicator: {
    width: '45%',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 10,
  },
  formatText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  formatHint: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    maxWidth: 250,
  },
  cameraContainer: {
    flex: 1,
    marginBottom: 20
  },
  viewfinder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayFrame: {
    position: 'absolute',
    top: 25,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2,
    borderRadius: 12,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  simulatedTable: {
    alignItems: 'center',
  },
  tableText: {
    fontSize: 20,
    marginBottom: 20,
    color: "white",
    fontFamily: "serif",
    fontStyle: "italic",
    fontWeight: "500"
  },
  instructionText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 250,
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingBar: {
    width: 150,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '60%',
    height: '100%',
    borderRadius: 2,
  },
  decisionOverlay: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  decisionContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  decisionText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidenceText: {
    color: 'white',
    fontSize: 14,
  },
  reasoningText: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  alternativesContainer: {
    alignItems: 'center',
  },
  alternativesLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 2,
  },
  alternativesText: {
    color: '#ccc',
    fontSize: 14,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  topControls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  autoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  autoButtonActive: {
    backgroundColor: '#1a73e8', // Will be overridden by getFormatColor()
  },
  autoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  autoButtonTextActive: {
    color: 'white',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: {
    backgroundColor: '#666',
  },
  captureInner: {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureLoading: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: 'white',
    borderTopColor: 'transparent',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStats: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  statsTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  statsTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  statsSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  refreshStatsButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: 'rgba(0,122,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 0,
  },
  refreshStatsButtonLoading: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    paddingHorizontal: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 8,
  },
  uploadedImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  analysisIdText: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  gameStateContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  gameStateLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 2,
  },
  gameStateText: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 10,
    width: '45%',
    justifyContent: 'center',
  },
  connectionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  retryButton: {
    padding: 5,
  },
  loadingModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingModalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingModalHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  loadingModalLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingModalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  loadingModalSubtitle: {
    color: '#999',
    fontSize: 14,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  progressBar: {
    width: 150,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stageSpinner: {
    marginRight: 8,
  },
  stageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  analysisSteps: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cancelAnalysisButton: {
    backgroundColor: '#ea4335',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelAnalysisText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
  },
  countdownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    zIndex: 2,
  },
  countdownPulse: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 1,
  },
  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalMetrics: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  recommendedButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recommendedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelModalButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  singleActionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  singleActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // General Modal Styles
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  generalModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  singleButton: {
    width: '100%',
    marginHorizontal: 0,
  },
  generalModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#6b7280',
  },
  destructiveButtonText: {
    color: 'white',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    margin: 20,
  },
  cameraPlaceholderText: {
    color: '#999',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 