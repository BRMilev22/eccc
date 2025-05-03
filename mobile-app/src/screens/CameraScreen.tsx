import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  Alert,
  Dimensions,
  StatusBar as RNStatusBar,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

// Define our own simple camera types to avoid issues with enum values
const CAMERA_TYPES = {
  BACK: 'back',
  FRONT: 'front'
};

const FLASH_MODES = {
  OFF: 'off',
  ON: 'on'
};

const CameraScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CAMERA_TYPES.BACK);
  const [flash, setFlash] = useState(FLASH_MODES.OFF);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // Use auth context
  const { refreshUser } = useAuth();

  const requestCameraPermission = async () => {
    try {
      setPermissionError(null);
      console.log("Requesting camera permission with ImagePicker...");
      
      // Use ImagePicker's camera permission request which is more stable
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("Camera permission status:", status);
      
      if (status === 'granted') {
        setHasPermission(true);
        
        // Also request media library permission for gallery access
        const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (galleryStatus.status !== 'granted') {
          Alert.alert('Permission needed', 'We need your permission to access your photo gallery');
        }
      } else {
        setHasPermission(false);
        setPermissionError('Camera permission was denied. Please enable it in your device settings.');
      }
    } catch (error) {
      console.error('Error in permission request flow:', error);
      setHasPermission(false);
      setPermissionError(`Error requesting camera permissions: ${error.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    requestCameraPermission();
    // Refresh user data when screen loads to ensure updated authentication state
    refreshUser();
  }, []);

  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Could not open settings:', error);
      Alert.alert('Error', 'Could not open settings. Please manually enable camera access in your device settings.');
    }
  };

  const takePicture = async () => {
    try {
      setIsCapturing(true);
      
      // Use ImagePicker to launch the camera
      const photo = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });
      
      if (!photo.canceled && photo.assets && photo.assets.length > 0) {
        // Navigate to photo review screen with the photo data
        navigation.navigate('PhotoReview', { imageUri: photo.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => 
      current === CAMERA_TYPES.BACK ? CAMERA_TYPES.FRONT : CAMERA_TYPES.BACK
    );
  };

  const toggleFlash = () => {
    setFlash(current => 
      current === FLASH_MODES.OFF 
        ? FLASH_MODES.ON 
        : FLASH_MODES.OFF
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        navigation.navigate('PhotoReview', { imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image from gallery');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.loadingContainer}
        >
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </LinearGradient>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.loadingContainer}
        >
          <Text style={styles.noAccess}>No access to camera</Text>
          <Text style={styles.permissionText}>
            We need camera access to allow you to take photos of trash.
          </Text>
          
          {permissionError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{permissionError}</Text>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.permissionButton, styles.secondaryButton]} 
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.permissionButton} 
              onPress={requestCameraPermission}
            >
              <Text style={styles.permissionButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.permissionButton, styles.settingsButton]} 
            onPress={openAppSettings}
          >
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Render camera interface with ImagePicker
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Camera placeholder */}
      <View style={styles.camera}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.7)', 'rgba(46, 125, 50, 0.4)']}
          style={styles.cameraPlaceholder}
        >
          <Ionicons name="camera" size={50} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.cameraText}>Camera Ready</Text>
          <Text style={styles.cameraSubtext}>Tap the button below to take a photo</Text>
        </LinearGradient>
      </View>
      
      <SafeAreaView style={styles.controlsOverlay} pointerEvents="box-none">
        {/* Top header bar */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle" size={28} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>TrashTracker</Text>
          
          <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
            <Ionicons
              name={flash === FLASH_MODES.OFF ? 'flash-off' : 'flash'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>
        
        {/* Bottom controls - moved up */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Ionicons name="images" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.captureButton, isCapturing && styles.capturingButton]} 
            onPress={takePicture}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => navigation.navigate('Map')}
          >
            <Ionicons name="map" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <BottomNavigation currentScreen="Camera" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  cameraSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 + 10 : 10,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 100,
    paddingHorizontal: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  capturingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  noAccess: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
    marginHorizontal: 20,
  },
  errorText: {
    color: '#ffcccc',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    marginTop: 10,
  },
});

export default CameraScreen; 