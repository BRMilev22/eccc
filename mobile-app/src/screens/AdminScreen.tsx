import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getTrashReports, updateTrashReportStatus, TrashReport } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from '../components/BottomNavigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Admin'>;

const statusOptions = [
  { label: 'Reported', value: 'REPORTED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Cleaned', value: 'CLEANED' },
];

const AdminScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [reports, setReports] = useState<TrashReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<TrashReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<TrashReport | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (activeFilter) {
      setFilteredReports(reports.filter(report => 
        (report.status || 'REPORTED').toUpperCase() === activeFilter
      ));
    } else {
      setFilteredReports(reports);
    }
  }, [reports, activeFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getTrashReports();
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const handleLogout = () => {
    navigation.navigate('Welcome');
  };

  const handleReportPress = (report: TrashReport) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedReport) return;
    
    try {
      setUpdating(true);
      await updateTrashReportStatus(String(selectedReport.id), newStatus);
      
      // Update the local state
      const updatedReports = reports.map(report => {
        if (report.id === selectedReport.id) {
          return { ...report, status: newStatus };
        }
        return report;
      });
      
      setReports(updatedReports);
      Alert.alert('Success', 'Report status updated successfully');
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating report status:', error);
      Alert.alert('Error', 'Failed to update report status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'REPORTED':
        return { bg: 'rgba(255, 152, 0, 0.2)', text: '#EF6C00' };
      case 'IN_PROGRESS':
        return { bg: 'rgba(33, 150, 243, 0.2)', text: '#1976D2' };
      case 'CLEANED':
        return { bg: 'rgba(76, 175, 80, 0.2)', text: '#2E7D32' };
      default:
        return { bg: 'rgba(158, 158, 158, 0.2)', text: '#757575' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#757575" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === '' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('')}
        >
          <Text style={activeFilter === '' ? styles.activeFilterText : styles.filterText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'REPORTED' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('REPORTED')}
        >
          <Text style={activeFilter === 'REPORTED' ? styles.activeFilterText : styles.filterText}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'IN_PROGRESS' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('IN_PROGRESS')}
        >
          <Text style={activeFilter === 'IN_PROGRESS' ? styles.activeFilterText : styles.filterText}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'CLEANED' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('CLEANED')}
        >
          <Text style={activeFilter === 'CLEANED' ? styles.activeFilterText : styles.filterText}>Cleaned</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.reports}
        contentContainerStyle={styles.reportsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : filteredReports.length > 0 ? (
          filteredReports.map(report => {
            // Use the status or default to 'REPORTED'
            const status = (report.status || 'REPORTED').toUpperCase();
            const statusStyle = getStatusColor(status);
            
            return (
              <TouchableOpacity 
                key={report.id}
                style={styles.reportCard}
                onPress={() => handleReportPress(report)}
              >
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>Report #{report.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.reportContent}>
                  <Image 
                    source={{ uri: report.photo_url || report.photoUrl || report.imageUrl }} 
                    style={styles.reportImage}
                  />
                  <View style={styles.reportDetails}>
                    <Text style={styles.reportDate}>
                      {formatDate(report.created_at || report.createdAt || '')}
                    </Text>
                    {report.description && (
                      <Text style={styles.reportDescription} numberOfLines={2}>
                        {report.description}
                      </Text>
                    )}
                    <Text style={styles.reportLocation}>
                      Lat: {typeof report.latitude === 'string' 
                            ? parseFloat(report.latitude).toFixed(4) 
                            : report.latitude.toFixed(4)}, 
                      Lon: {typeof report.longitude === 'string'
                            ? parseFloat(report.longitude).toFixed(4)
                            : report.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#BDBDBD" />
            <Text style={styles.emptyText}>No reports in this category</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Report Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            {selectedReport && (
              <View style={styles.modalContent}>
                <Image 
                  source={{ uri: selectedReport.photo_url || selectedReport.photoUrl || selectedReport.imageUrl }}
                  style={styles.modalImage}
                />
                
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoTitle}>Report #{selectedReport.id}</Text>
                  <Text style={styles.modalInfoDate}>
                    {formatDate(selectedReport.created_at || selectedReport.createdAt || '')}
                  </Text>
                  
                  {selectedReport.description && (
                    <View style={styles.modalInfoSection}>
                      <Text style={styles.modalInfoLabel}>Description:</Text>
                      <Text style={styles.modalInfoText}>{selectedReport.description}</Text>
                    </View>
                  )}
                  
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalInfoLabel}>Location:</Text>
                    <Text style={styles.modalInfoText}>
                      Latitude: {typeof selectedReport.latitude === 'string' 
                                ? parseFloat(selectedReport.latitude).toFixed(6) 
                                : selectedReport.latitude.toFixed(6)}{'\n'}
                      Longitude: {typeof selectedReport.longitude === 'string'
                                ? parseFloat(selectedReport.longitude).toFixed(6)
                                : selectedReport.longitude.toFixed(6)}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalInfoLabel}>Current Status:</Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColor(selectedReport.status || 'REPORTED').bg }
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        { color: getStatusColor(selectedReport.status || 'REPORTED').text }
                      ]}>
                        {(selectedReport.status || 'REPORTED').toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalActions}>
                    <Text style={styles.modalInfoLabel}>Update Status:</Text>
                    <View style={styles.statusButtons}>
                      {statusOptions.map(option => (
                        <TouchableOpacity 
                          key={option.value}
                          style={[
                            styles.statusButton,
                            (selectedReport.status || 'REPORTED') === option.value && styles.activeStatusButton,
                          ]}
                          onPress={() => handleStatusChange(option.value)}
                          disabled={updating || (selectedReport.status || 'REPORTED') === option.value}
                        >
                          <Text style={[
                            styles.statusButtonText,
                            (selectedReport.status || 'REPORTED') === option.value && styles.activeStatusButtonText,
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.viewMapButton}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('Map');
                    }}
                  >
                    <LinearGradient
                      colors={['#66BB6A', '#4CAF50']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.viewMapButtonText}>View on Map</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      <BottomNavigation currentScreen="Profile" />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
  },
  activeFilterButton: {
    backgroundColor: '#E8F5E9',
  },
  filterText: {
    color: '#757575',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  reports: {
    flex: 1,
  },
  reportsContent: {
    padding: 16,
    paddingBottom: 80, // Space for bottom nav
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportContent: {
    flexDirection: 'row',
    padding: 12,
  },
  reportImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  reportDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  reportDate: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  reportLocation: {
    fontSize: 12,
    color: '#757575',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 0,
  },
  modalImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  modalInfo: {
    padding: 16,
  },
  modalInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalInfoDate: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  modalInfoSection: {
    marginBottom: 16,
  },
  modalInfoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#666',
  },
  modalActions: {
    marginTop: 8,
    marginBottom: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  activeStatusButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#757575',
  },
  activeStatusButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  viewMapButton: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminScreen; 