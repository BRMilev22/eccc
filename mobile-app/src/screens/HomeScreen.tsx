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
import BottomNavigation from '../components/BottomNavigation';
import { ChemistryTheme } from '../theme/theme';
import SchoolLogoIcon from '../../assets/school-logo-icon';
import ChemistryIcon from '../../assets/chemistry-icon';
import EcoIcon from '../../assets/eco-icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const [reports, setReports] = useState<TrashReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();

  useEffect(() => {
    // Auto-redirect to Camera screen as that should be the primary screen
    setTimeout(() => {
      navigation.replace('Camera');
    }, 100);
  }, []);

  const renderReports = () => {
    if (!Array.isArray(reports) || reports.length === 0) {
      return (
        <View style={styles.noReportsContainer}>
          <View style={styles.glassCard}>
            <Text style={styles.noReportsText}>Няма доклади за околната среда</Text>
            <Text style={styles.noReportsSubtext}>Бъдете първият, който ще докладва за проблеми във вашия район!</Text>
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
                colors={[
                  'rgba(255, 255, 255, 0.9)', 
                  'rgba(245, 248, 255, 0.8)'
                ]}
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
                  <Text style={styles.reportTitle}>Еко Доклад #{report?.id || 'Нов'}</Text>
                  {report?.description && (
                    <Text style={styles.reportDescription} numberOfLines={2}>
                      {report.description}
                    </Text>
                  )}
                  <View style={
                    [styles.statusBadge, 
                      { backgroundColor: 
                        status === 'REPORTED' ? 'rgba(74, 108, 179, 0.2)' : 
                        status === 'IN_PROGRESS' ? 'rgba(59, 89, 152, 0.2)' : 
                        'rgba(74, 144, 114, 0.2)'
                      }
                    ]
                  }>
                    <Text style={
                      [styles.statusText, 
                        { color: 
                          status === 'REPORTED' ? ChemistryTheme.colors.secondary : 
                          status === 'IN_PROGRESS' ? ChemistryTheme.colors.primary : 
                          ChemistryTheme.colors.success
                        }
                      ]
                    }>
                      {(status || '').replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.viewDetails}>Докоснете за подробности</Text>
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
      setError('Грешка при зареждане на доклади');
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
      Alert.alert('Permission required', 'You need to grant camera permission to report environmental issues.');
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
          colors={[
            'rgba(59, 89, 152, 0.7)', 
            'rgba(74, 108, 179, 0.7)'
          ]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Зареждане на доклади...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <LinearGradient
        colors={[ChemistryTheme.colors.background, 'rgba(255, 255, 255, 0.95)']}
        style={styles.headerContainer}
      >
        <View style={styles.headerContent}>
          <View style={styles.appNameContainer}>
            <SchoolLogoIcon size={32} />
            <Text style={styles.appName}>ХимиЕко</Text>
          </View>
          <Text style={styles.headerText}>Химия за устойчива околна среда</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[ChemistryTheme.colors.primary]} 
          />
        }
      >
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleAddReport}
          >
            <LinearGradient
              colors={[ChemistryTheme.colors.primary, ChemistryTheme.colors.secondary]}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.actionButtonIcon}>+</Text>
              <Text style={styles.actionButtonText}>Use Camera</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleViewMap}
          >
            <LinearGradient
              colors={[ChemistryTheme.colors.success, 'rgba(74, 144, 114, 0.8)']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <EcoIcon width={24} height={24} color="#fff" />
              <Text style={styles.actionButtonText}>View Map</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <ChemistryIcon width={24} height={24} color={ChemistryTheme.colors.primary} />
            <Text style={styles.sectionTitle}>Доклади за околната среда</Text>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {renderReports()}
      </ScrollView>

      <BottomNavigation currentScreen="Camera" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChemistryTheme.colors.background,
  },
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 10,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
    color: ChemistryTheme.colors.primary,
  },
  headerText: {
    fontSize: 14,
    color: ChemistryTheme.colors.text,
    opacity: 0.8,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom navigation
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  actionButton: {
    flex: 1,
    height: 60,
    marginHorizontal: 6,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonGradient: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionButtonIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: ChemistryTheme.colors.primary,
  },
  errorText: {
    color: ChemistryTheme.colors.error,
    marginTop: 6,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ChemistryTheme.colors.background,
  },
  loadingGradient: {
    width: '80%',
    padding: 30,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  noReportsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  noReportsText: {
    fontSize: 18,
    fontWeight: '600',
    color: ChemistryTheme.colors.primary,
    marginBottom: 8,
  },
  noReportsSubtext: {
    fontSize: 14,
    color: ChemistryTheme.colors.text,
    opacity: 0.7,
    textAlign: 'center',
  },
  reportsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  reportCardContainer: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reportCard: {
    padding: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  reportImageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  reportImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  reportInfo: {
    padding: 16,
  },
  reportTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    color: ChemistryTheme.colors.primary,
  },
  reportDescription: {
    fontSize: 14,
    color: ChemistryTheme.colors.text,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewDetails: {
    fontSize: 13,
    color: ChemistryTheme.colors.secondary,
    fontWeight: '500',
  },
});

export default HomeScreen; 