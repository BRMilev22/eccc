import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator, 
  SafeAreaView, 
  Platform, 
  Alert 
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { getTrashReports, TrashReport } from '../services/api';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import TrashIcon from '../../assets/trash-icon';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MapScreen: React.FC = () => {
  const [reports, setReports] = useState<TrashReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user's location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        
        // Fetch trash reports
        const data = await getTrashReports();
        
        // Validate the data before setting it
        const validReports = data.filter(report => 
          report && 
          report.id && 
          (typeof report.latitude === 'number' || typeof report.latitude === 'string') &&
          (typeof report.longitude === 'number' || typeof report.longitude === 'string')
        );
        
        setReports(validReports);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load trash reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReportPress = () => {
    navigation.navigate('Home');
  };

  const handleMarkerPress = (report: TrashReport) => {
    // Validate the report before navigating
    if (!report || !report.id) {
      Alert.alert('Error', 'Invalid report data');
      return;
    }
    
    // Ensure latitude and longitude are valid
    if (
      (typeof report.latitude !== 'number' && typeof report.latitude !== 'string') || 
      (typeof report.longitude !== 'number' && typeof report.longitude !== 'string')
    ) {
      Alert.alert('Error', 'This report has invalid location data');
      return;
    }
    
    navigation.navigate('Details', { report });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['rgba(46, 125, 50, 0.7)', 'rgba(76, 175, 80, 0.7)']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.glassCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.navigate('Map')}
          >
            <LinearGradient
              colors={['#66BB6A', '#4CAF50']}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.5)']}
              style={styles.backButtonGradient}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
        style={styles.headerContainer}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.navigationBackButton}
            onPress={handleBackPress}
          >
            <View style={styles.navigationBackButtonInner}>
              <Text style={styles.navigationBackButtonText}>←</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Trash Reports Map</Text>
            <Text style={styles.headerSubtitle}>View all reported trash locations</Text>
          </View>
        </View>
      </LinearGradient>
      
      <MapView
        style={styles.map}
        initialRegion={userLocation ? {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : {
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {reports.map((report) => {
          // Parse latitude and longitude to ensure they're numbers
          const latitude = typeof report.latitude === 'string' 
            ? parseFloat(report.latitude) 
            : report.latitude;
            
          const longitude = typeof report.longitude === 'string' 
            ? parseFloat(report.longitude) 
            : report.longitude;
          
          return (
            <Marker
              key={report.id}
              coordinate={{
                latitude,
                longitude,
              }}
              onPress={() => handleMarkerPress(report)}
            >
              <View style={styles.markerContainer}>
                <LinearGradient
                  colors={['#EF5350', '#D32F2F']}
                  style={styles.markerGradient}
                >
                  <TrashIcon width={20} height={20} color="#FFF" />
                </LinearGradient>
              </View>
              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>Trash Report #{report.id}</Text>
                  {report.description && (
                    <Text style={styles.calloutDescription} numberOfLines={2}>
                      {report.description}
                    </Text>
                  )}
                  <Text style={styles.calloutAction}>Tap for details</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
      
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={handleReportPress}
        >
          <LinearGradient
            colors={['#66BB6A', '#4CAF50']}
            style={styles.fabGradient}
          >
            <Text style={styles.fabIcon}>+</Text>
            <Text style={styles.fabText}>Report Trash</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {reports.length === 0 && !loading && (
        <View style={styles.noDataContainer}>
          <View style={styles.glassCard}>
            <Text style={styles.noDataText}>No trash reports found</Text>
            <Text style={styles.noDataSubtext}>Be the first to report trash in your area!</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationBackButton: {
    marginRight: 12,
  },
  navigationBackButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  navigationBackButtonText: {
    fontSize: 22,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  map: {
    width,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.7)',
  },
  loadingGradient: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(245, 245, 245, 0.7)',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  retryButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 16,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  calloutContainer: {
    width: 200,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 6,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 8,
  },
  calloutAction: {
    fontSize: 11,
    color: '#4CAF50',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  noDataContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -width * 0.4 }, { translateY: -50 }],
    width: width * 0.8,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#616161',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});

export default MapScreen; 