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
import { ChemistryTheme } from '../theme/theme';

type PhotoReviewScreenRouteProp = RouteProp<RootStackParamList, 'PhotoReview'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoReview'>;

const trashTypes = [
  { label: 'Изберете тип отпадък', value: '' },
  { label: 'Пластмаса (бутилки, торбички, кутии)', value: 'PLASTIC', color: '#1E88E5', icon: 'water-outline' },
  { label: 'Хранителни и органични', value: 'FOOD', color: '#8BC34A', icon: 'fast-food-outline' },
  { label: 'Опасни материали', value: 'HAZARDOUS', color: '#F44336', icon: 'warning-outline' },
  { label: 'Хартия и картон', value: 'PAPER', color: '#795548', icon: 'newspaper-outline' },
  { label: 'Смесени/Други', value: 'MIXED', color: '#9C27B0', icon: 'trash-outline' },
];

const severityLabels = {
  LOW: 'НИС',
  MEDIUM: 'СРЕ',
  HIGH: 'ВИС'
};

const severityLevels = [
  { label: 'Изберете ниво на сериозност', value: '' },
  { 
    label: 'ф - Малко количество, лесно за почистване', 
    value: 'LOW', 
    color: '#8BC34A',
    description: 'Малко количество отпадъци, което един човек може да почисти за няколко минути'
  },
  { 
    label: 'Средно - Умерено количество, нужда от внимание', 
    value: 'MEDIUM', 
    color: '#FFC107',
    description: 'Забележимо количество отпадъци, които биха изисквали усилие за почистване'
  },
  { 
    label: 'Високо - Голямо струпване, нужда от спешно почистване', 
    value: 'HIGH', 
    color: '#F44336',
    description: 'Значително количество отпадъци, изискващо организирано почистване'
  },
];

// Helper function for translating severity levels
const getSeverityLabel = (value: string) => {
  switch(value) {
    case 'LOW': return 'НИС';
    case 'MEDIUM': return 'СРЕ';
    case 'HIGH': return 'ВИС';
    default: return value;
  }
};

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
          setLocationError('Достъпът до местоположението е отказан');
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
        Alert.alert('Грешка', 'Необходимо е местоположение. Моля, опитайте отново с включено местоположение.');
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
          'Докладът е изпратен като гост',
          'Вашият доклад е изпратен анонимно. Създайте акаунт, за да проследявате и управлявате докладите си!',
          [
            { text: 'Добре', onPress: () => navigateHome() }
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
          'Изпращане като гост?',
          'Не сте влезли в системата. Искате ли да изпратите този доклад като гост?',
          [
            {
              text: 'Да, изпрати',
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
                  
                  Alert.alert('Успех', 'Благодарим за доклада! Изпратен е като гост.');
                  
                  setTimeout(() => {
                    navigateHome();
                  }, 1500);
                } catch (innerError) {
                  Alert.alert('Грешка', 'Неуспешно изпращане на доклада. Моля, опитайте отново по-късно.');
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
        Alert.alert('Грешка', 'Неуспешно изпращане на доклада. Моля, опитайте отново.');
        setSubmitting(false);
      }
    }
  };

  const testConnection = async () => {
    try {
      setSubmitting(true);
      const result = await testApiConnection();
      Alert.alert('API Тест', result.message);
    } catch (error) {
      console.error('Error testing API:', error);
      Alert.alert('Неуспешен API тест', `Грешка: ${error}`);
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
        <Text style={styles.headerTitle}>Преглед на снимка</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Локация</Text>
          {locationLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={ChemistryTheme.colors.primary} />
              <Text style={styles.loadingText}>Получаване на локация...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={18} color="#F44336" />
              <Text style={styles.errorText}>Грешка при изпращане на снимка</Text>
            </View>
          ) : (
            <View style={styles.locationInfoContainer}>
              <Ionicons name="location" size={18} color={ChemistryTheme.colors.primary} />
              <Text style={styles.locationText}>
                {location?.coords.latitude.toFixed(6)}, {location?.coords.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Тип отпадък</Text>
          <Text style={styles.sectionSubtitle}>Какъв вид отпадък открихте?</Text>
          
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
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Ниво на сериозност</Text>
          <Text style={styles.sectionSubtitle}>Какво е количеството отпадъци?</Text>
          
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
                    {level.value === 'LOW' ? 'НИСК.' : level.value === 'MEDIUM' ? 'СРЕД.' : level.value === 'HIGH' ? 'ВИСО.' : level.value}
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
          <Text style={styles.sectionTitle}>Допълнителни бележки (незадължително)</Text>
          <TextInput
            style={styles.descriptionInput}
            multiline
            numberOfLines={4}
            placeholder="Добавете допълнителни детайли за отпадъците..."
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
          <Text style={styles.testButtonText}>Тест на връзката</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={submitReport}
          disabled={submitting || locationLoading}
        >
          <LinearGradient
            colors={[ChemistryTheme.colors.secondary, ChemistryTheme.colors.primary]}
            style={styles.gradientButton}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Изпрати</Text>
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
    backgroundColor: 'transparent',
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