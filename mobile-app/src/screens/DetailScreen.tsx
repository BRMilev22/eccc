import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Share,
  Dimensions,
  Platform,
  Linking
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TrashReport, updateTrashReport, getCurrentUser } from '../services/api';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import TrashIcon from '../../assets/trash-icon';

type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;

// Define status colors for status badge
const statusColors = {
  REPORTED: '#EF5350',
  IN_PROGRESS: '#42A5F5',
  CLEANED: '#66BB6A',
  VERIFIED: '#AB47BC',
  DEFAULT: '#9E9E9E'
};

// Define status descriptions
const statusDescriptions = {
  REPORTED: 'Newly reported trash that needs attention',
  IN_PROGRESS: 'Cleanup is currently in progress',
  CLEANED: 'This location has been cleaned',
  VERIFIED: 'The cleanup has been verified'
};

const DetailScreen: React.FC = () => {
  const route = useRoute<DetailScreenRouteProp>();
  const navigation = useNavigation();
  const { report } = route.params;
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusOptionsVisible, setStatusOptionsVisible] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(report.status || 'REPORTED');
  
  useEffect(() => {
    // Check if user is admin
    const checkUserRole = async () => {
      try {
        const user = await getCurrentUser();
        setIsAdmin(user?.role === 'admin');
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkUserRole();
  }, []);

  const getStatusColor = (status: string) => {
    return statusColors[status] || statusColors.DEFAULT;
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleViewOnMap = () => {
    const latitude = typeof report.latitude === 'string' 
      ? parseFloat(report.latitude) 
      : report.latitude;
      
    const longitude = typeof report.longitude === 'string' 
      ? parseFloat(report.longitude) 
      : report.longitude;

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
  };

  const handleShareReport = async () => {
    try {
      const latitude = typeof report.latitude === 'string' 
        ? parseFloat(report.latitude) 
        : report.latitude;
        
      const longitude = typeof report.longitude === 'string' 
        ? parseFloat(report.longitude) 
        : report.longitude;

      const result = await Share.share({
        message: `Help clean up trash! Location: https://maps.google.com/maps?q=${latitude},${longitude} | Trash Tracker Report #${report.id}`,
        title: 'Help clean up trash in your area!'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      const response = await updateTrashReport(report.id, { status: newStatus });
      
      if (response) {
        setCurrentStatus(newStatus);
        Alert.alert('Success', `Report status updated to ${newStatus.replace('_', ' ').toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update report status');
    } finally {
      setLoading(false);
      setStatusOptionsVisible(false);
    }
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
              style={styles.backButtonGradient}
            >
              <Text style={styles.backButtonText}>←</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Trash Report #{report.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}>
              <Text style={styles.statusText}>
                {currentStatus.replace('_', ' ')}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShareReport}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
              style={styles.shareButtonGradient}
            >
              <Ionicons name="share-outline" size={20} color="#2E7D32" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <View style={styles.imageContainer}>
          {report.photo_url || report.photoUrl || report.imageUrl ? (
            <Image 
              source={{ uri: report.photo_url || report.photoUrl || report.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={60} color="#BDBDBD" />
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}
        </View>
        
        <View style={styles.detailsCard}>
          <View style={styles.statusInfoContainer}>
            <View style={styles.statusInfoIcon}>
              <LinearGradient
                colors={[getStatusColor(currentStatus), getStatusColor(currentStatus) + '80']}
                style={styles.statusInfoIconGradient}
              >
                <Ionicons 
                  name={
                    currentStatus === 'REPORTED' ? 'alert-circle-outline' :
                    currentStatus === 'IN_PROGRESS' ? 'construct-outline' :
                    currentStatus === 'CLEANED' ? 'checkmark-circle-outline' :
                    'shield-checkmark-outline'
                  } 
                  size={24} 
                  color="#FFF" 
                />
              </LinearGradient>
            </View>
            <View style={styles.statusInfoText}>
              <Text style={styles.statusInfoTitle}>Status: {currentStatus.replace('_', ' ')}</Text>
              <Text style={styles.statusInfoDescription}>
                {statusDescriptions[currentStatus] || 'No status information available'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailsIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
              </View>
              <View style={styles.detailsContent}>
                <Text style={styles.detailsLabel}>Reported</Text>
                <Text style={styles.detailsValue}>{report.created_at ? getFormattedDate(report.created_at) : 'Unknown'}</Text>
              </View>
            </View>
            
            {report.trash_type && (
              <View style={styles.detailsRow}>
                <View style={styles.detailsIconContainer}>
                  <Ionicons name="trash-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.detailsContent}>
                  <Text style={styles.detailsLabel}>Trash Type</Text>
                  <Text style={styles.detailsValue}>{report.trash_type}</Text>
                </View>
              </View>
            )}
            
            {report.severity && (
              <View style={styles.detailsRow}>
                <View style={styles.detailsIconContainer}>
                  <Ionicons name="warning-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.detailsContent}>
                  <Text style={styles.detailsLabel}>Severity</Text>
                  <Text style={styles.detailsValue}>{report.severity}</Text>
                </View>
              </View>
            )}
            
            {report.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{report.description}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Location</Text>
            
            <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: typeof report.latitude === 'string' ? parseFloat(report.latitude) : report.latitude,
                  longitude: typeof report.longitude === 'string' ? parseFloat(report.longitude) : report.longitude,
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
                    latitude: typeof report.latitude === 'string' ? parseFloat(report.latitude) : report.latitude,
                    longitude: typeof report.longitude === 'string' ? parseFloat(report.longitude) : report.longitude,
                  }}
                >
                  <View style={styles.markerContainer}>
                    <LinearGradient
                      colors={[getStatusColor(currentStatus), getStatusColor(currentStatus) + '80']}
                      style={styles.markerGradient}
                    >
                      <TrashIcon width={16} height={16} color="#FFF" />
                    </LinearGradient>
                  </View>
                </Marker>
              </MapView>
              
              <TouchableOpacity
                style={styles.mapActionButton}
                onPress={handleViewOnMap}
              >
                <LinearGradient
                  colors={['#66BB6A', '#4CAF50']}
                  style={styles.mapActionButtonGradient}
                >
                  <Text style={styles.mapActionButtonText}>View in Maps</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {isAdmin && (
        <View style={styles.adminActionsContainer}>
          {statusOptionsVisible ? (
            <View style={styles.statusOptionsContainer}>
              <View style={styles.statusOptionsCard}>
                <Text style={styles.statusOptionsTitle}>Update Status</Text>
                {Object.keys(statusDescriptions).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      status === currentStatus && styles.statusOptionActive
                    ]}
                    onPress={() => handleStatusChange(status)}
                    disabled={loading || status === currentStatus}
                  >
                    <View 
                      style={[
                        styles.statusOptionDot, 
                        { backgroundColor: getStatusColor(status) }
                      ]} 
                    />
                    <Text 
                      style={[
                        styles.statusOptionText,
                        status === currentStatus && styles.statusOptionTextActive
                      ]}
                    >
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.closeStatusOptionsButton}
                  onPress={() => setStatusOptionsVisible(false)}
                >
                  <Text style={styles.closeStatusOptionsText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.adminActionButton}
              onPress={() => setStatusOptionsVisible(true)}
            >
              <LinearGradient
                colors={['#66BB6A', '#4CAF50']}
                style={styles.adminActionButtonGradient}
              >
                <Ionicons name="create-outline" size={20} color="#FFF" style={styles.adminActionButtonIcon} />
                <Text style={styles.adminActionButtonText}>Update Status</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButtonText: {
    fontSize: 24,
    color: '#2E7D32',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  shareButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#E0E0E0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 16,
    color: '#9E9E9E',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    marginBottom: 24,
  },
  statusInfoIcon: {
    marginRight: 16,
  },
  statusInfoIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfoText: {
    flex: 1,
  },
  statusInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 4,
  },
  statusInfoDescription: {
    fontSize: 14,
    color: '#757575',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailsContent: {
    flex: 1,
  },
  detailsLabel: {
    fontSize: 14,
    color: '#757575',
  },
  detailsValue: {
    fontSize: 16,
    color: '#424242',
    fontWeight: '500',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 22,
  },
  mapSection: {
    marginBottom: 24,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  map: {
    width: '100%',
    height: 200,
  },
  mapActionButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mapActionButtonGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  mapActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  adminActionsContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  adminActionButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  adminActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  adminActionButtonIcon: {
    marginRight: 8,
  },
  adminActionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusOptionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    top: -Dimensions.get('window').height + 100,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: 16,
  },
  statusOptionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statusOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusOptionActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  statusOptionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#424242',
  },
  statusOptionTextActive: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  closeStatusOptionsButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeStatusOptionsText: {
    fontSize: 16,
    color: '#757575',
  }
});

export default DetailScreen; 