import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator, 
  SafeAreaView, 
  Platform, 
  Alert,
  Image
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { getTrashReports, TrashReport } from '../services/api';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import TrashIcon from '../../assets/trash-icon';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define status colors and icons to have icons for each status
const statusInfo = {
  REPORTED: { icon: "alert-circle", colors: ['#EF5350', '#D32F2F'] }, // Red gradient with alert icon
  IN_PROGRESS: { icon: "refresh-circle", colors: ['#42A5F5', '#1976D2'] }, // Blue gradient with refresh icon
  CLEANED: { icon: "checkmark-circle", colors: ['#66BB6A', '#388E3C'] }, // Green gradient with checkmark icon
  VERIFIED: { icon: "shield-checkmark", colors: ['#AB47BC', '#7B1FA2'] }, // Purple gradient with shield-checkmark icon
  DEFAULT: { icon: "help-circle", colors: ['#9E9E9E', '#616161'] } // Gray gradient with question mark icon
};

// Define trash type icons with distinct icons and colors
const trashTypeInfo = {
  PLASTIC: { icon: "water", color: "#2196F3" }, // Water icon for plastic
  PAPER: { icon: "newspaper", color: "#FFC107" }, // Newspaper icon for paper
  FOOD: { icon: "fast-food", color: "#FF9800" }, // Fast food icon for food waste
  HAZARDOUS: { icon: "warning", color: "#F44336" }, // Warning icon for hazardous
  ELECTRONICS: { icon: "hardware-chip", color: "#9C27B0" }, // Chip icon for electronics
  MIXED: { icon: "layers", color: "#795548" }, // Layers icon for mixed trash
  DEFAULT: { icon: "trash", color: "#9E9E9E" } // Trash icon for default
};

// Define severity icons and colors
const severityInfo = {
  LOW: { icon: "thermometer-outline", color: "#8BC34A" }, // Thermometer with low temperature for low severity
  MEDIUM: { icon: "flame-outline", color: "#FFC107" }, // Small flame for medium severity
  HIGH: { icon: "flame", color: "#F44336" }, // Large flame for high severity
  DEFAULT: { icon: "remove", color: "#9E9E9E" } // Default icon
};

// Define status descriptions for the legend
const statusDescriptions = {
  REPORTED: 'Newly reported',
  IN_PROGRESS: 'Cleanup in progress',
  CLEANED: 'Cleaned',
  VERIFIED: 'Verified clean'
};

// Helper function to format dates nicely
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently reported';
    }
    
    // Format as relative time if recent, otherwise show full date
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      // Less than a day ago
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours < 1) {
        // Less than an hour ago
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes < 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      // Less than a week ago
      return `${diffDays} days ago`;
    } else {
      // More than a week ago
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently reported';
  }
};

const MapScreen: React.FC = () => {
  const [reports, setReports] = useState<TrashReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [mapType, setMapType] = useState('standard');
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<NavigationProp>();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<TrashReport | null>(null);

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
        
        // Log reports to check trash_type field
        console.log("Trash reports data:", data.map(r => ({
          id: r.id,
          trash_type: r.trash_type || r.trashType || "N/A",
          status: r.status || "N/A",
          severity: r.severityLevel || "N/A"
        })));
        
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

  const getFilteredReports = () => {
    if (!selectedCategory) return reports;
    return reports.filter(report => (report.status || 'REPORTED').toUpperCase() === selectedCategory);
  };

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
    
    // Set this report as selected to show visual feedback
    setSelectedReportId(Number(report.id));
    setSelectedReport(report);
    
    // Animate map to the selected marker
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: typeof report.latitude === 'string' ? parseFloat(report.latitude) : report.latitude,
        longitude: typeof report.longitude === 'string' ? parseFloat(report.longitude) : report.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleViewDetails = () => {
    if (selectedReport) {
      navigation.navigate('Details', { report: selectedReport });
    }
  };

  const handleClosePreview = () => {
    setSelectedReport(null);
    setSelectedReportId(null);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleFilterPress = (category: string | null) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const toggleMapType = () => {
    setMapType(mapType === 'standard' ? 'satellite' : 'standard');
  };

  const animateToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const getStatusInfo = (status: string | undefined) => {
    const normalizedStatus = status ? status.toUpperCase() : 'REPORTED';
    return statusInfo[normalizedStatus] || statusInfo.DEFAULT;
  };

  const getTrashTypeInfo = (trashType: string | undefined) => {
    if (!trashType) return trashTypeInfo.DEFAULT;
    
    // First console.log to see what we're getting from API
    console.log(`Getting trash type info for: "${trashType}"`);
    
    // Normalize the trash type by converting to uppercase and trimming
    const normalizedType = trashType.trim().toUpperCase();
    
    // Check if the normalized type exists in our definitions
    const info = trashTypeInfo[normalizedType];
    
    // If not found, log it and return default
    if (!info) {
      console.log(`No matching icon found for type: ${normalizedType}, using default`);
      return trashTypeInfo.DEFAULT;
    }
    
    return info;
  };

  const getSeverityInfo = (severity: string | undefined) => {
    if (!severity) return severityInfo.DEFAULT;
    const normalizedSeverity = severity.toUpperCase();
    return severityInfo[normalizedSeverity] || severityInfo.DEFAULT;
  };

  const StatusLegend = () => (
    <View style={styles.legendContainer}>
      <Text style={styles.legendTitle}>Map Legend:</Text>
      
      <Text style={styles.legendSectionTitle}>Status (Center Icon)</Text>
      {Object.entries(statusInfo).filter(([key]) => key !== 'DEFAULT').map(([status, info]) => (
        <TouchableOpacity 
          key={status} 
          style={[
            styles.legendItem,
            selectedCategory === status && styles.legendItemSelected
          ]}
          onPress={() => handleFilterPress(status)}
        >
          <View style={[styles.legendIndicator, { backgroundColor: info.colors[0] }]}>
            <Ionicons name={info.icon} size={12} color="#FFF" />
          </View>
          <Text style={styles.legendText}>{statusDescriptions[status]}</Text>
        </TouchableOpacity>
      ))}
      
      <Text style={styles.legendSectionTitle}>Trash Types (Top-Right Badge)</Text>
      {Object.entries(trashTypeInfo).filter(([key]) => key !== 'DEFAULT').map(([type, info]) => (
        <View key={type} style={styles.legendItem}>
          <View style={[
            styles.legendIndicator, 
            { backgroundColor: info.color },
            type === 'HAZARDOUS' && styles.legendHazardousIndicator
          ]}>
            <Ionicons name={info.icon} size={12} color="#FFF" />
          </View>
          <Text style={[
            styles.legendText,
            type === 'HAZARDOUS' && styles.legendHazardousText
          ]}>
            {type.charAt(0) + type.slice(1).toLowerCase()}
            {type === 'HAZARDOUS' && ' ⚠️'}
          </Text>
        </View>
      ))}
      
      <Text style={styles.legendSectionTitle}>Severity Levels (Bottom-Right Badge)</Text>
      {Object.entries(severityInfo).filter(([key]) => key !== 'DEFAULT').map(([level, info]) => (
        <View key={level} style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: info.color }]}>
            <Ionicons name={info.icon} size={12} color="#FFF" />
          </View>
          <Text style={styles.legendText}>{level.charAt(0) + level.slice(1).toLowerCase()}</Text>
        </View>
      ))}
    </View>
  );

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

  const filteredReports = getFilteredReports();

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
            <Text style={styles.headerSubtitle}>
              {selectedCategory ? `Filtered: ${statusDescriptions[selectedCategory]}` : 'All reported trash locations'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.legendToggleButton}
            onPress={() => setShowLegend(!showLegend)}
          >
            <Ionicons name={showLegend ? "close" : "filter"} size={22} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {showLegend && <StatusLegend />}
      
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={mapType}
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
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {filteredReports.map((report) => {
          // Parse latitude and longitude to ensure they're numbers
          const latitude = typeof report.latitude === 'string' 
            ? parseFloat(report.latitude) 
            : report.latitude;
            
          const longitude = typeof report.longitude === 'string' 
            ? parseFloat(report.longitude) 
            : report.longitude;
            
          // Get the report's trash type from either snake_case or camelCase property
          const reportTrashType = report.trash_type || report.trashType;
          
          // Log the current report and its trash_type
          console.log(`Rendering marker for report ${report.id}, trash_type: ${reportTrashType}, severity: ${report.severityLevel}`);
          
          // Get trash type info including icon and color
          const typeInfo = getTrashTypeInfo(reportTrashType);
          const isHazardous = reportTrashType && reportTrashType.toUpperCase() === 'HAZARDOUS';
          
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
                {/* Main circle with status color */}
                <LinearGradient
                  colors={getStatusInfo(report.status).colors}
                  style={[
                    styles.markerGradient,
                    selectedReportId === Number(report.id) && styles.selectedMarker,
                    isHazardous && styles.hazardousMarker
                  ]}
                >
                  {/* Status icon in the center */}
                  <Ionicons 
                    name={getStatusInfo(report.status).icon} 
                    size={22} 
                    color="#FFF" 
                  />
                </LinearGradient>
                
                {/* Trash type icon in top-right badge */}
                <View 
                  style={[
                    styles.iconBadge, 
                    styles.topRightBadge,
                    { backgroundColor: typeInfo.color },
                    isHazardous && styles.hazardousBadge
                  ]}
                >
                  <Ionicons 
                    name={typeInfo.icon} 
                    size={14} 
                    color="#FFF" 
                  />
                </View>
                
                {/* Severity icon in bottom-right badge */}
                {report.severityLevel && (
                  <View 
                    style={[
                      styles.iconBadge, 
                      styles.bottomRightBadge,
                      { backgroundColor: getSeverityInfo(report.severityLevel).color }
                    ]}
                  >
                    <Ionicons 
                      name={getSeverityInfo(report.severityLevel).icon} 
                      size={14} 
                      color="#FFF" 
                    />
                  </View>
                )}
                
                {/* If hazardous, add dashed border for extra visibility */}
                {isHazardous && (
                  <View style={styles.hazardousBorder} />
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>
      
      <View style={styles.mapControls}>
        <TouchableOpacity 
          style={styles.mapControlButton}
          onPress={toggleMapType}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
            style={styles.mapControlGradient}
          >
            <Ionicons 
              name={mapType === 'standard' ? "map-outline" : "earth-outline"} 
              size={24} 
              color="#2E7D32" 
            />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.mapControlButton}
          onPress={animateToUserLocation}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
            style={styles.mapControlGradient}
          >
            <Ionicons name="locate-outline" size={24} color="#2E7D32" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
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

      {filteredReports.length === 0 && !loading && (
        <View style={styles.noDataContainer}>
          <View style={styles.glassCard}>
            <Text style={styles.noDataText}>No trash reports found</Text>
            <Text style={styles.noDataSubtext}>
              {selectedCategory 
                ? `No ${statusDescriptions[selectedCategory].toLowerCase()} reports available` 
                : 'Be the first to report trash in your area!'}
            </Text>
          </View>
        </View>
      )}

      {/* Preview panel for selected reports */}
      {selectedReport && (
        <View style={styles.previewContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
            style={styles.previewGradient}
          >
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Trash Report #{selectedReport.id}</Text>
              <TouchableOpacity onPress={handleClosePreview}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.previewContent}>
              {/* Date reported */}
              <View style={styles.dateContainer}>
                <Ionicons name="time-outline" size={16} color="#757575" />
                <Text style={styles.dateText}>
                  {formatDate(selectedReport.createdAt || selectedReport.created_at)}
                </Text>
              </View>
              
              {selectedReport.photo_url || selectedReport.photoUrl || selectedReport.imageUrl ? (
                <Image
                  source={{ uri: selectedReport.photo_url || selectedReport.photoUrl || selectedReport.imageUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.previewNoImage}>
                  <Ionicons name="image-outline" size={40} color="#BDBDBD" />
                </View>
              )}
              
              <View style={styles.previewInfo}>
                <View style={styles.attributeRowContainer}>
                  {/* Status attribute row */}
                  <View style={styles.attributeRow}>
                    <View style={[styles.attributeIcon, { backgroundColor: getStatusInfo(selectedReport.status).colors[0] }]}>
                      <Ionicons name={getStatusInfo(selectedReport.status).icon} size={14} color="#FFF" />
                    </View>
                    <Text style={styles.attributeText}>
                      Status: {(selectedReport.status || 'REPORTED').replace('_', ' ')}
                    </Text>
                  </View>
                  
                  {/* Trash type attribute row */}
                  {(selectedReport.trash_type || selectedReport.trashType) && (
                    <View style={styles.attributeRow}>
                      <View style={[
                        styles.attributeIcon, 
                        { backgroundColor: getTrashTypeInfo(selectedReport.trash_type || selectedReport.trashType).color },
                        (selectedReport.trash_type || selectedReport.trashType || '').toUpperCase() === 'HAZARDOUS' && { borderColor: '#FF0000', borderWidth: 2 }
                      ]}>
                        <Ionicons name={getTrashTypeInfo(selectedReport.trash_type || selectedReport.trashType).icon} size={14} color="#FFF" />
                      </View>
                      <Text style={[
                        styles.attributeText,
                        (selectedReport.trash_type || selectedReport.trashType || '').toUpperCase() === 'HAZARDOUS' && { fontWeight: 'bold', color: '#F44336' }
                      ]}>
                        Type: {(selectedReport.trash_type || selectedReport.trashType || '').charAt(0) + (selectedReport.trash_type || selectedReport.trashType || '').slice(1).toLowerCase()}
                        {(selectedReport.trash_type || selectedReport.trashType || '').toUpperCase() === 'HAZARDOUS' && ' ⚠️'}
                      </Text>
                    </View>
                  )}
                  
                  {/* Severity attribute row */}
                  {selectedReport.severityLevel && (
                    <View style={styles.attributeRow}>
                      <View style={[styles.attributeIcon, { backgroundColor: getSeverityInfo(selectedReport.severityLevel).color }]}>
                        <Ionicons name={getSeverityInfo(selectedReport.severityLevel).icon} size={14} color="#FFF" />
                      </View>
                      <Text style={styles.attributeText}>
                        Severity: {selectedReport.severityLevel.charAt(0) + selectedReport.severityLevel.slice(1).toLowerCase()}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Description */}
                {selectedReport.description && (
                  <Text style={styles.previewDescription} numberOfLines={2}>
                    {selectedReport.description}
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.previewButton}
              onPress={handleViewDetails}
            >
              <LinearGradient
                colors={['#66BB6A', '#4CAF50']}
                style={styles.previewButtonGradient}
              >
                <Text style={styles.previewButtonText}>View Details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
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
  legendToggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  legendContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  legendItemSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  legendMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  legendText: {
    fontSize: 14,
    color: '#424242',
  },
  map: {
    width,
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 140,
    right: 16,
    flexDirection: 'column',
  },
  mapControlButton: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapControlGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
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
  markerBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  markerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  selectedMarker: {
    width: 48,
    height: 48,
    borderWidth: 3,
    borderColor: '#FFF',
    transform: [{ scale: 1.1 }],
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
    transform: [{ translateX: -150 }, { translateY: -60 }],
    width: 300,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  previewContainer: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  previewGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  previewContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  previewNoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  previewStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  previewStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  previewTypeText: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 6,
  },
  previewDescription: {
    fontSize: 14,
    color: '#212121',
  },
  previewButton: {
    borderRadius: 25,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  previewButtonGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 25,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  markerIndicator: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  typeIndicator: {
    top: -5,
    right: -5,
  },
  severityIndicator: {
    bottom: -5,
    right: -5,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  legendSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: 12,
    marginBottom: 4,
  },
  legendIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  previewStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  previewIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  previewSeverityText: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 6,
  },
  detailsContainer: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  detailText: {
    fontSize: 14,
    color: '#424242',
  },
  severityDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'white',
  },
  hazardousMarker: {
    borderColor: '#FF0000',
    borderWidth: 3,
  },
  hazardousBorder: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#FF0000',
    borderStyle: 'dashed',
  },
  highSeverityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    bottom: 2,
    right: 2,
  },
  legendHazardousIndicator: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  legendHazardousText: {
    fontWeight: 'bold',
    color: '#F44336',
  },
  iconBadge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  topRightBadge: {
    top: -10,
    right: -10,
    zIndex: 2,
  },
  bottomRightBadge: {
    bottom: -10,
    right: -10,
    zIndex: 2,
  },
  hazardousBadge: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  attributeRowContainer: {
    marginBottom: 8,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  attributeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  attributeText: {
    fontSize: 14,
    color: '#424242',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    color: '#757575',
    fontSize: 14,
    marginLeft: 6,
    fontStyle: 'italic',
  },
});

export default MapScreen; 