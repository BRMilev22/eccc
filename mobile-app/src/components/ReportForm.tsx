import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { submitTrashReport, TrashReportData } from '../services/api';

interface ReportFormProps {
  photoUri: string;
  onBack: () => void;
  onSubmitSuccess: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ photoUri, onBack, onSubmitSuccess }) => {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        setLocation(currentLocation);
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError('Failed to get your location. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Error', 'Location data is required. Please wait or try again.');
      return;
    }

    try {
      setSubmitting(true);
      
      // In a real app, you would upload the image to a storage service
      // and get a URL back. For simplicity, we're just using the local URI.
      const reportData: TrashReportData = {
        photoUrl: photoUri,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        description: description.trim() || undefined,
      };

      await submitTrashReport(reportData);
      Alert.alert('Success', 'Trash report submitted successfully!');
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit trash report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Report Trash</Text>
      
      <View style={styles.photoContainer}>
        <Image source={{ uri: photoUri }} style={styles.photo} />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Location</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#0066CC" />
        ) : locationError ? (
          <Text style={styles.errorText}>{locationError}</Text>
        ) : location ? (
          <Text style={styles.locationText}>
            Lat: {location.coords.latitude.toFixed(6)}, Lng: {location.coords.longitude.toFixed(6)}
          </Text>
        ) : (
          <Text style={styles.errorText}>Unable to get location</Text>
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Add any additional details about the trash..."
          value={description}
          onChangeText={setDescription}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={onBack}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.submitButton, (submitting || loading) && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={submitting || loading}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  photoContainer: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  locationText: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportForm; 