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
import { ChemistryTheme } from '../theme/theme';

type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;

// Define status colors for status badge
const statusColors = {
  REPORTED: '#FF5252',
  IN_PROGRESS: '#2196F3',
  CLEANED: ChemistryTheme.colors.primary,
  VERIFIED: '#9C27B0'
};

// Define status descriptions
const statusDescriptions = {
  REPORTED: 'Ново съобщение за боклук, което изисква внимание',
  IN_PROGRESS: 'Очистването е в процес',
  CLEANED: 'Този район е почистен',
  VERIFIED: 'Очистването е потвърдено'
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
        message: `Помогнете за почистването на боклука! Местоположение: https://maps.google.com/maps?q=${latitude},${longitude} | Trash Tracker Доклад #${report.id}`,
        title: 'Помогнете за почистването на боклука във вашия район!'
      });
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно споделяне на доклада');
    }
  };

  const handleStatusChange = async (newStatus: keyof typeof statusDescriptions) => {
    try {
      setLoading(true);
      const response = await updateTrashReport(report.id, { status: newStatus });
      if (response) {
        setCurrentStatus(newStatus);
        Alert.alert('Успешно', `Статусът на доклада е променен на ${statusDescriptions[newStatus]}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Грешка', 'Неуспешно обновяване на статуса');
    } finally {
      setLoading(false);
      setStatusOptionsVisible(false);
    }
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
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
            <Text style={styles.headerTitle}>Подробности</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}>
              <Text style={styles.statusText}>
                {statusDescriptions[currentStatus as keyof typeof statusDescriptions]}
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
              <Ionicons name="share-outline" size={20} color={ChemistryTheme.colors.primary} />
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
              <Text style={styles.noImageText}>Няма налично изображение</Text>
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
              <Text style={styles.statusInfoTitle}>Статус: {currentStatus.replace('_', ' ')}</Text>
              <Text style={styles.statusInfoDescription}>
                {statusDescriptions[currentStatus as keyof typeof statusDescriptions] || 'Няма налична информация за статуса'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Описание</Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailsIconContainer}>
                <Ionicons name="calendar-outline" size={20} color={ChemistryTheme.colors.primary} />
              </View>
              <View style={styles.detailsContent}>
                <Text style={styles.detailsLabel}>Дата на доклад</Text>
                <Text style={styles.detailsValue}>{report.createdAt ? getFormattedDate(report.createdAt) : 'Неизвестна'}</Text>
              </View>
            </View>
            
            {report.trashType && (
              <View style={styles.detailsRow}>
                <View style={styles.detailsIconContainer}>
                  <Ionicons name="trash-outline" size={20} color={ChemistryTheme.colors.primary} />
                </View>
                <View style={styles.detailsContent}>
                  <Text style={styles.detailsLabel}>Тип отпадък</Text>
                  <Text style={styles.detailsValue}>{report.trashType}</Text>
                </View>
              </View>
            )}
            
            {report.severityLevel && (
              <View style={styles.detailsRow}>
                <View style={styles.detailsIconContainer}>
                  <Ionicons name="warning-outline" size={20} color={ChemistryTheme.colors.primary} />
                </View>
                <View style={styles.detailsContent}>
                  <Text style={styles.detailsLabel}>Сериозност</Text>
                  <Text style={styles.detailsValue}>{report.severityLevel}</Text>
                </View>
              </View>
            )}
            
            {report.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Описание</Text>
                <Text style={styles.descriptionText}>{report.description}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Местоположение</Text>
            
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
                  colors={[ChemistryTheme.colors.secondary, ChemistryTheme.colors.primary]}
                  style={styles.mapActionButtonGradient}
                >
                  <Text style={styles.mapActionButtonText}>Отвори в Карти</Text>
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
                <Text style={styles.statusOptionsTitle}>Промяна на статус</Text>
                {(Object.keys(statusDescriptions) as Array<keyof typeof statusDescriptions>).map((status) => (
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
                      {statusDescriptions[status]}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.closeStatusOptionsButton}
                  onPress={() => setStatusOptionsVisible(false)}
                >
                  <Text style={styles.closeStatusOptionsText}>Отказ</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.adminActionButton}
              onPress={() => setStatusOptionsVisible(true)}
            >
              <LinearGradient
                colors={[ChemistryTheme.colors.secondary, ChemistryTheme.colors.primary]}
                style={styles.adminActionButtonGradient}
              >
                <Ionicons name="create-outline" size={20} color="#FFF" style={styles.adminActionButtonIcon} />
                <Text style={styles.adminActionButtonText}>Промяна на статус</Text>
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
    color: ChemistryTheme.colors.primary,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ChemistryTheme.colors.primary,
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
    color: ChemistryTheme.colors.primary,
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
    color: ChemistryTheme.colors.primary,
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
    color: ChemistryTheme.colors.primary,
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