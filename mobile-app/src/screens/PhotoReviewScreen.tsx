import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { submitTrashReport, uploadImage, testApiConnection } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Button } from 'react-native-paper';

type PhotoReviewScreenRouteProp = RouteProp<RootStackParamList, 'PhotoReview'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoReview'>;

const trashTypes = [
  { label: 'Select Trash Type', value: '' },
  { label: 'Plastic (bottles, bags, containers)', value: 'PLASTIC', color: '#1E88E5', icon: 'water-outline' },
  { label: 'Food & Organic Waste', value: 'FOOD', color: '#8BC34A', icon: 'fast-food-outline' },
  { label: 'Hazardous Materials', value: 'HAZARDOUS', color: '#F44336', icon: 'warning-outline' },
  { label: 'Paper & Cardboard', value: 'PAPER', color: '#795548', icon: 'newspaper-outline' },
  { label: 'Electronics', value: 'ELECTRONICS', color: '#607D8B', icon: 'hardware-chip-outline' },
  { label: 'Mixed/Other', value: 'MIXED', color: '#9C27B0', icon: 'trash-outline' },
];

const severityLevels = [
  { label: 'Select Severity Level', value: '' },
  { 
    label: 'Low - Small amount, easy to clean', 
    value: 'LOW', 
    color: '#8BC34A',
    description: 'A small amount of trash that one person could clean up in a few minutes'
  },
  { 
    label: 'Medium - Moderate pile, needs attention', 
    value: 'MEDIUM', 
    color: '#FFC107',
    description: 'A noticeable amount of trash that would take some effort to clean up'
  },
  { 
    label: 'High - Large dump, urgent cleanup needed', 
    value: 'HIGH', 
    color: '#F44336',
    description: 'A significant amount of trash requiring organized cleanup effort'
  },
];

const PhotoReviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PhotoReviewScreenRouteProp>();
  const { imageUri } = route.params;

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [trashType, setTrashType] = useState('');
  const [severityLevel, setSeverityLevel] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      try {
        setLocationLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          setLocationLoading(false);
          return;
        }
        
        const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(currentLocation);
        setLocationError(null);
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError('Could not get your location');
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  const submitReport = async () => {
    try {
      setSubmitting(true);
      
      // Validate location
      if (!location) {
        Alert.alert('Error', 'Location is required. Please try again with location enabled.');
        setSubmitting(false);
        return;
      }
      
      // Build the report data
      const reportData: TrashReportData = {
        photoUrl: imageUri,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        description: description,
        status: 'REPORTED',
        createdAt: new Date().toISOString(),
        trashType: trashType || undefined,
        severityLevel: severityLevel || undefined
      };
      
      console.log('Submitting report with data:', reportData);
      
      // Try to submit the report
      const result = await submitTrashReport(reportData);
      
      console.log('Report submitted successfully:', result);
      
      // Show success feedback to user
      setSubmitSuccess(true);
      
      // Check if this was submitted as a guest by directly checking for an auth token
      const authToken = await AsyncStorage.getItem('authToken');
      const isAuthenticated = !!authToken;
      
      if (!isAuthenticated) {
        // For guest submissions, show an informative message
        Alert.alert(
          'Report Submitted as Guest',
          'Your report has been submitted anonymously. Create an account to track and manage your reports!',
          [
            { text: 'OK', onPress: () => navigateHome() }
          ]
        );
      } else {
        // Just navigate back if user is authenticated
        setTimeout(() => {
          navigateHome();
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        // Handle auth error more gracefully - try to submit as guest
        Alert.alert(
          'Submit as Guest?',
          'You are not logged in. Would you like to submit this report as a guest?',
          [
            {
              text: 'Yes, submit',
              onPress: async () => {
                try {
                  // Submit as guest using the guest endpoint
                  const reportData: TrashReportData = {
                    photoUrl: imageUri,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    description: description,
                    status: 'REPORTED',
                    createdAt: new Date().toISOString(),
                    trashType: trashType || undefined,
                    severityLevel: severityLevel || undefined
                  };
                  
                  // Use the guest endpoint
                  const result = await submitTrashReport(reportData);
                  setSubmitSuccess(true);
                  
                  Alert.alert('Success', 'Thank you for your report! It has been submitted as a guest.');
                  
                  setTimeout(() => {
                    navigateHome();
                  }, 1500);
                } catch (innerError) {
                  Alert.alert('Error', 'Failed to submit report. Please try again later.');
                  console.error('Error in guest submission:', innerError);
                  setSubmitting(false);
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setSubmitting(false)
            }
          ]
        );
      } else {
        // Generic error
        Alert.alert('Error', 'Failed to submit report. Please try again.');
        setSubmitting(false);
      }
    }
  };

  const testConnection = async () => {
    try {
      setSubmitting(true);
      const result = await testApiConnection();
      Alert.alert('API Test', result.message);
    } catch (error) {
      console.error('Error testing API:', error);
      Alert.alert('API Test Failed', `Error: ${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  const navigateHome = () => {
    // Navigate back to home screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home', params: { refresh: true } }]
    });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Trash</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          {locationLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={18} color="#F44336" />
              <Text style={styles.errorText}>{locationError}</Text>
            </View>
          ) : (
            <View style={styles.locationInfoContainer}>
              <Ionicons name="location" size={18} color="#4CAF50" />
              <Text style={styles.locationText}>
                {location?.coords.latitude.toFixed(6)}, {location?.coords.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Trash Type</Text>
          <Text style={styles.sectionSubtitle}>What kind of trash did you find?</Text>
          
          <View style={styles.trashTypeContainer}>
            {trashTypes.filter(type => type.value !== '').map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.trashTypeButton,
                  trashType === type.value && { backgroundColor: type.color, borderColor: type.color }
                ]}
                onPress={() => setTrashType(type.value)}
              >
                <Ionicons
                  name={type.icon}
                  size={24}
                  color={trashType === type.value ? 'white' : type.color}
                  style={styles.trashTypeIcon}
                />
                <Text
                  style={[
                    styles.trashTypeText,
                    trashType === type.value && { color: 'white' }
                  ]}
                >
                  {type.label.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Severity Level</Text>
          <Text style={styles.sectionSubtitle}>How much trash is there?</Text>
          
          <View style={styles.severityContainer}>
            {severityLevels.filter(level => level.value !== '').map(level => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.severityButton,
                  { borderColor: level.color },
                  severityLevel === level.value && { backgroundColor: level.color }
                ]}
                onPress={() => setSeverityLevel(level.value)}
              >
                <View style={styles.severityLabelContainer}>
                  <Text
                    style={[
                      styles.severityLabelText,
                      severityLevel === level.value && { color: 'white' }
                    ]}
                  >
                    {level.value}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.severityDescriptionText,
                    severityLevel === level.value && { color: 'white' }
                  ]}
                >
                  {level.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            multiline
            numberOfLines={4}
            placeholder="Add any additional details about this trash..."
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </ScrollView>
      
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testConnection}
          disabled={submitting}
        >
          <Text style={styles.testButtonText}>Test API Connection</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={submitReport}
          disabled={submitting || locationLoading}
        >
          <LinearGradient
            colors={['#66BB6A', '#4CAF50']}
            style={styles.gradientButton}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#E0E0E0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    color: '#F44336',
  },
  locationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 8,
    color: '#333',
  },
  trashTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trashTypeButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  trashTypeIcon: {
    marginBottom: 8,
  },
  trashTypeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  severityContainer: {
    marginBottom: 8,
  },
  severityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  severityLabelContainer: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'inherit',
  },
  severityLabelText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  severityDescriptionText: {
    flex: 1,
    fontSize: 14,
  },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footerContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  testButton: {
    backgroundColor: '#888',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PhotoReviewScreen; 