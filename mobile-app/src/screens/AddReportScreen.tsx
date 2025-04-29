import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { submitTrashReport, uploadImage } from '../services/api';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

type AddReportScreenRouteProp = RouteProp<RootStackParamList, 'AddReport'>;
type AddReportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const getSubmittablePhotoUrl = (uri: string): string => {
  // On physical devices, file:// URIs might not be accessible to the server
  // Return a placeholder URL for testing
  if (uri.startsWith('file://')) {
    return 'https://example.com/placeholder.jpg';
  }
  return uri;
};

const AddReportScreen: React.FC = () => {
  const navigation = useNavigation<AddReportScreenNavigationProp>();
  const route = useRoute<AddReportScreenRouteProp>();
  const { imageUri } = route.params;

  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(true);

  React.useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required');
          setFetchingLocation(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        setFetchingLocation(false);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Failed to get your location');
        setFetchingLocation(false);
      }
    };

    getLocation();
  }, []);

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Missing location', 'Please wait for your location to be determined');
      return;
    }

    if (description.trim() === '') {
      Alert.alert('Missing description', 'Please provide a description of the trash');
      return;
    }

    if (!imageUri) {
      Alert.alert('Missing image', 'No image was selected. Please go back and try again.');
      return;
    }

    setLoading(true);
    try {
      console.log('Uploading image to server...');
      
      // First, upload the image to get a public URL
      const uploadedImageUrl = await uploadImage(imageUri);
      console.log('Image uploaded, received URL:', uploadedImageUrl);
      
      console.log('Now submitting report with uploaded image URL');
      console.log('Location:', location);
      console.log('Description:', description);

      // Create report data with the uploaded image URL
      const reportData = {
        photoUrl: uploadedImageUrl, // Use the URL from the server
        latitude: location.latitude,
        longitude: location.longitude,
        description,
        status: 'REPORTED', // This will be ignored by the API service
        createdAt: new Date().toISOString(), // This will be ignored by the API service
      };
      
      console.log('Report data being sent:', JSON.stringify(reportData, null, 2));
      
      // Submit report
      await submitTrashReport(reportData);
      
      setLoading(false);
      Alert.alert(
        'Success',
        'Your trash report has been submitted successfully',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Force refresh reports when returning to home
              navigation.navigate('Home', { refresh: true });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      setLoading(false);
      
      // Show more detailed error message
      let errorMessage = 'Failed to submit your report. Please try again.';
      if (error instanceof Error) {
        errorMessage += '\n\nError details: ' + error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Trash</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe the trash and location"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Location</Text>
        <View style={styles.locationContainer}>
          {fetchingLocation ? (
            <ActivityIndicator size="small" color="#0096FF" />
          ) : location ? (
            <Text style={styles.locationText}>
              {`Lat: ${location.latitude.toFixed(6)}, Long: ${location.longitude.toFixed(6)}`}
            </Text>
          ) : (
            <Text style={styles.errorText}>Failed to get location</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, (loading || fetchingLocation) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading || fetchingLocation}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  imageContainer: {
    padding: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
  },
  locationContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#555',
  },
  errorText: {
    fontSize: 14,
    color: 'red',
  },
  submitButton: {
    backgroundColor: '#0096FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#99cced',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddReportScreen; 