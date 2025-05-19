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
import { ChemistryTheme } from '../theme/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Admin'>;

const statusOptions = [
  { label: 'Докладвано', value: 'REPORTED' },
  { label: 'В процес', value: 'IN_PROGRESS' },
  { label: 'Почистено', value: 'CLEANED' },
  { label: 'Проверено', value: 'VERIFIED' }
];

// Helper function to get status label
const getStatusLabel = (status: string) => {
  const option = statusOptions.find(opt => opt.value === status);
  return option ? option.label : 'Докладвано';
};

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
      Alert.alert('Грешка', 'Неуспешно зареждане на докладите');
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
      Alert.alert('Успешно', 'Статусът на доклада е обновен успешно');
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating report status:', error);
      Alert.alert('Грешка', 'Неуспешно обновяване на статуса');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'CLEANED':
        return { bg: 'rgba(59, 89, 152, 0.2)', text: ChemistryTheme.colors.primary };
      case 'IN_PROGRESS':
        return { bg: 'rgba(66, 165, 245, 0.2)', text: '#1976D2' };
      case 'VERIFIED':
        return { bg: 'rgba(171, 71, 188, 0.2)', text: '#7B1FA2' };
      case 'REPORTED':
      default:
        return { bg: 'rgba(239, 83, 80, 0.2)', text: '#D32F2F' };
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Неизвестна дата';
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleViewOnMap = () => {
    setModalVisible(false);
    navigation.navigate('Map');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Админ панел</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#757575" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === '' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('')}
        >
          <Text style={activeFilter === '' ? styles.activeFilterText : styles.filterText}>Всички</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'REPORTED' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('REPORTED')}
        >
          <Text style={activeFilter === 'REPORTED' ? styles.activeFilterText : styles.filterText}>Докладвано</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'IN_PROGRESS' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('IN_PROGRESS')}
        >
          <Text style={activeFilter === 'IN_PROGRESS' ? styles.activeFilterText : styles.filterText}>В процес</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'CLEANED' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('CLEANED')}
        >
          <Text style={activeFilter === 'CLEANED' ? styles.activeFilterText : styles.filterText}>Почистено</Text>
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
            <ActivityIndicator size="large" color={ChemistryTheme.colors.primary} />
            <Text style={styles.loadingText}>Зареждане на докладите...</Text>
          </View>
        ) : filteredReports.length > 0 ? (
          filteredReports.map(report => {
            // Use the status or default to 'REPORTED'
            const status = (report.status || 'REPORTED').toUpperCase();
            const statusStyle = getStatusColors(status);
            
            return (
              <TouchableOpacity 
                key={report.id}
                style={styles.reportCard}
                onPress={() => handleReportPress(report)}
              >
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>Доклад №{report.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {getStatusLabel(status)}
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
                      Ширина: {typeof report.latitude === 'string' 
                            ? parseFloat(report.latitude).toFixed(4) 
                            : report.latitude.toFixed(4)}, 
                      Дължина: {typeof report.longitude === 'string'
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
            <Text style={styles.emptyText}>Няма доклади в тази категория</Text>
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
              <Text style={styles.modalTitle}>Подробности за доклада</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            {selectedReport && (
              <View style={styles.modalContent}>
                {selectedReport.imageUrl ? (
                  <Image
                    source={{ uri: selectedReport.imageUrl }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.modalImage}>
                    <Text style={styles.modalImagePlaceholder}>Няма снимка</Text>
                  </View>
                )}
                
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoTitle}>Доклад №{selectedReport.id}</Text>
                  <Text style={styles.modalInfoDate}>
                    Докладвано на {formatDate(selectedReport.createdAt)}
                  </Text>
                  
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalInfoLabel}>Местоположение:</Text>
                    <Text style={styles.modalInfoText}>
                      {`Ширина: ${typeof selectedReport.latitude === 'string' 
                        ? parseFloat(selectedReport.latitude).toFixed(6)
                        : selectedReport.latitude.toFixed(6)}`}
                    </Text>
                    <Text style={styles.modalInfoText}>
                      {`Дължина: ${typeof selectedReport.longitude === 'string'
                        ? parseFloat(selectedReport.longitude).toFixed(6)
                        : selectedReport.longitude.toFixed(6)}`}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalInfoLabel}>Текущ статус:</Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColors(selectedReport.status || 'REPORTED').bg }
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        { color: getStatusColors(selectedReport.status || 'REPORTED').text }
                      ]}>
                        {statusOptions.find(opt => opt.value === (selectedReport.status || 'REPORTED'))?.label || 'Докладвано'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalActions}>
                    <Text style={styles.modalInfoLabel}>Промяна на статус:</Text>
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
                    onPress={handleViewOnMap}
                  >
                    <LinearGradient
                      colors={[ChemistryTheme.colors.secondary, ChemistryTheme.colors.primary]}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.viewMapButtonText}>Виж на картата</Text>
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
    backgroundColor: 'rgba(59, 89, 152, 0.2)',
  },
  filterText: {
    color: '#757575',
    fontSize: 14,
  },
  activeFilterText: {
    color: ChemistryTheme.colors.primary,
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
  modalImagePlaceholder: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 14,
    marginTop: 80,
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
    backgroundColor: 'rgba(59, 89, 152, 0.2)',
    borderColor: ChemistryTheme.colors.primary,
  },
  statusButtonText: {
    fontSize: 12,
    color: '#757575',
  },
  activeStatusButtonText: {
    color: ChemistryTheme.colors.primary,
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