import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getTrashReports, TrashReport } from '../services/api';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import TrashIcon from '../../assets/trash-icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const [reports, setReports] = useState<TrashReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();

  const renderReports = () => {
    if (!Array.isArray(reports) || reports.length === 0) {
      return (
        <View style={styles.noReportsContainer}>
          <View style={styles.glassCard}>
            <Text style={styles.noReportsText}>No trash reports yet</Text>
            <Text style={styles.noReportsSubtext}>Be the first to report trash in your area!</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.reportsContainer}>
        {reports.map((report) => {
          // Handle both snake_case and camelCase fields
          const imageUrl = report.imageUrl || report.photo_url;
          const status = report.status || 'REPORTED'; // Default status if not provided
          
          return (
            <TouchableOpacity
              key={report?.id || Math.random().toString()}
              style={styles.reportCardContainer}
              onPress={() => handleReportPress(report)}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                style={styles.reportCard}
              >
                {imageUrl && (
                  <View style={styles.reportImageContainer}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.reportImage}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                      style={styles.imageOverlay}
                    />
                  </View>
                )}
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>Trash Report #{report?.id || 'New'}</Text>
                  {report?.description && (
                    <Text style={styles.reportDescription} numberOfLines={2}>
                      {report.description}
                    </Text>
                  )}
                  <View style={
                    [styles.statusBadge, 
                      { backgroundColor: 
                        status === 'REPORTED' ? 'rgba(255, 152, 0, 0.2)' : 
                        status === 'IN_PROGRESS' ? 'rgba(33, 150, 243, 0.2)' : 
                        'rgba(76, 175, 80, 0.2)'
                      }
                    ]
                  }>
                    <Text style={
                      [styles.statusText, 
                        { color: 
                          status === 'REPORTED' ? '#EF6C00' : 
                          status === 'IN_PROGRESS' ? '#1976D2' : 
                          '#2E7D32'
                        }
                      ]
                    }>
                      {(status || '').replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.viewDetails}>Tap to view details</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getTrashReports();
      setReports(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load trash reports. Please try again.');
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Listen for navigation params to refresh
  useEffect(() => {
    if (route.params?.refresh) {
      // Reset the parameter to avoid infinite refreshes
      navigation.setParams({ refresh: undefined });
      // Fetch fresh reports
      fetchReports();
    }
  }, [route.params?.refresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
  };

  const handleAddReport = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'You need to grant camera permission to report trash.');
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      exif: false, // Don't include EXIF data
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Log the URI to inspect it
      console.log('Image URI:', result.assets[0].uri);
      navigation.navigate('AddReport', { imageUri: result.assets[0].uri });
    }
  };

  const handleViewMap = () => {
    navigation.navigate('Map');
  };

  const handleReportPress = (report: TrashReport) => {
    navigation.navigate('Details', { report });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['rgba(46, 125, 50, 0.7)', 'rgba(76, 175, 80, 0.7)']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading trash reports...</Text>
        </LinearGradient>
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
          <View style={styles.appNameContainer}>
            <TrashIcon width={28} height={28} color="#2E7D32" />
            <Text style={styles.appName}>TrashSpotter</Text>
          </View>
          <Text style={styles.headerText}>Help keep our environment clean</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
      >
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleAddReport}
          >
            <LinearGradient
              colors={['#66BB6A', '#4CAF50']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.actionButtonIcon}>+</Text>
              <Text style={styles.actionButtonText}>Report Trash</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleViewMap}
          >
            <LinearGradient
              colors={['rgba(38, 50, 56, 0.8)', 'rgba(55, 71, 79, 0.8)']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.actionButtonIcon}>🗺️</Text>
              <Text style={styles.actionButtonText}>View Map</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.glassCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={fetchReports}
              >
                <LinearGradient
                  colors={['#66BB6A', '#4CAF50']}
                  style={styles.retryButtonGradient}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            {renderReports()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    alignItems: 'center',
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 10,
  },
  headerText: {
    fontSize: 14,
    color: '#616161',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    maxWidth: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  actionButtonIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  reportsContainer: {
    paddingHorizontal: 16,
  },
  reportCardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  reportCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  reportImageContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  reportImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
  },
  reportInfo: {
    padding: 16,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewDetails: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  noReportsContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  noReportsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#616161',
    marginBottom: 8,
  },
  noReportsSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  errorContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    alignItems: 'center',
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
});

export default HomeScreen; 