import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions,
  Linking,
  Share,
  Platform,
  Alert,
  BlurView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrashReport } from '../services/api';
import MapView, { Marker } from 'react-native-maps';
import TrashIcon from '../../assets/trash-icon';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const DetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Details'>>();
  const { report } = route.params || {};
  
  // Parse coordinates to ensure they're numbers
  const latitude = typeof report?.latitude === 'string' 
    ? parseFloat(report.latitude) 
    : (typeof report?.latitude === 'number' ? report.latitude : 0);
    
  const longitude = typeof report?.longitude === 'string' 
    ? parseFloat(report.longitude) 
    : (typeof report?.longitude === 'number' ? report.longitude : 0);

  // Check if we have valid report data
  if (!report || !report.id) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['rgba(46, 125, 50, 0.95)', 'rgba(46, 125, 50, 0.85)']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backButtonInner}>
              <Text style={styles.backButtonText}>←</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={styles.shareButton} />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <View style={styles.glassCard}>
            <Text style={styles.errorText}>Report data is invalid or missing</Text>
            <TouchableOpacity 
              style={styles.backToMapButton}
              onPress={() => navigation.navigate('Map')}
            >
              <LinearGradient
                colors={['#66BB6A', '#4CAF50']}
                style={styles.backToMapButtonGradient}
              >
                <Text style={styles.backToMapText}>Back to Map</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = report.createdAt 
    ? new Date(report.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown date';

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleOpenInMaps = () => {
    try {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${latitude},${longitude}`;
      const label = `Trash Report #${report.id}`;
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`
      });

      if (url) {
        Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Could not open maps application');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: `ECCC Trash Report #${report.id}`,
        message: `Check out this trash report at https://maps.google.com/?q=${latitude},${longitude}. ${report.description || ''}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Could not share this report');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['rgba(46, 125, 50, 0.95)', 'rgba(46, 125, 50, 0.85)']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <View style={styles.backButtonInner}>
            <Text style={styles.backButtonText}>←</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trash Report Details</Text>
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleShare}
        >
          <View style={styles.shareButtonInner}>
            <Text style={styles.shareButtonText}>Share</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.photoContainer}>
          {report.photo_url || report.photoUrl || report.imageUrl ? (
            <Image 
              source={{ uri: report.photo_url || report.photoUrl || report.imageUrl }} 
              style={styles.photo}
              resizeMode="cover"
              onError={(e) => {
                console.log('Image failed to load:', e.nativeEvent.error);
                console.log('Image URL attempted:', report.photo_url || report.photoUrl || report.imageUrl);
              }}
            />
          ) : (
            <View style={[styles.photo, styles.noPhotoContainer]}>
              <Text style={styles.noPhotoText}>No image available</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.photoOverlay}
          >
            <Text style={styles.photoTitle}>Report #{report.id}</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.glassCard}>
            <Text style={styles.title}>Report #{report.id}</Text>
            <Text style={styles.date}>Reported on {formattedDate}</Text>
            
            {report.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{report.description}</Text>
              </View>
            )}
          </View>
          
          <View style={[styles.glassCard, styles.locationCard]}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.locationText}>
              Latitude: {latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {longitude.toFixed(6)}
            </Text>
            
            <TouchableOpacity 
              style={styles.openMapsButton} 
              onPress={handleOpenInMaps}
            >
              <LinearGradient
                colors={['#66BB6A', '#4CAF50']}
                style={styles.openMapsButtonGradient}
              >
                <Text style={styles.openMapsButtonText}>Open in Maps</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.glassCard, styles.mapCard]}>
            <MapView
              style={styles.map}
              region={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude,
                  longitude,
                }}
              >
                <View style={styles.markerContainer}>
                  <LinearGradient
                    colors={['#EF5350', '#D32F2F']}
                    style={styles.markerGradient}
                  >
                    <TrashIcon width={20} height={20} color="#FFF" />
                  </LinearGradient>
                </View>
              </Marker>
            </MapView>
          </View>
          
          <TouchableOpacity 
            style={styles.backToMapButton}
            onPress={() => navigation.navigate('Map')}
          >
            <LinearGradient
              colors={['#66BB6A', '#4CAF50']}
              style={styles.backToMapButtonGradient}
            >
              <Text style={styles.backToMapText}>Back to Map</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    padding: 4,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shareButton: {
    padding: 4,
  },
  shareButtonInner: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  shareButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  photoContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  photoTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  noPhotoContainer: {
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    fontSize: 16,
    color: '#6c757d',
  },
  infoContainer: {
    padding: 16,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  locationCard: {
    backgroundColor: 'rgba(252, 252, 252, 0.9)',
  },
  mapCard: {
    padding: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 24,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#343a40',
    lineHeight: 24,
  },
  locationContainer: {
    marginBottom: 24,
  },
  locationText: {
    fontSize: 16,
    color: '#343a40',
    marginBottom: 6,
  },
  openMapsButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  openMapsButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  openMapsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 12,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 24,
  },
  backToMapButton: {
    marginTop: 16,
    alignSelf: 'center',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  backToMapButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  backToMapText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DetailsScreen; 