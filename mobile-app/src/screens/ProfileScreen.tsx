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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { 
  getTrashReports,
  getUserReports, 
  TrashReport, 
  getCurrentUser, 
  User,
  logout, 
  updateTrashReport,
  updateTrashReportStatus
} from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';
import { ChemistryTheme } from '../theme/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

type UserRole = 'guest' | 'user' | 'admin';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [reports, setReports] = useState<TrashReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<TrashReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  
  // Use the auth context instead of local state for user
  const { user, isAuthenticated, logout: authLogout, refreshUser, isLoading: authLoading } = useAuth();
  const userRole = user?.isAdmin ? 'admin' : (isAuthenticated ? 'user' : 'guest');

  useEffect(() => {
    // Call refreshUser to make sure we have the latest user data
    refreshUser();
    fetchReports();
  }, []);

  useEffect(() => {
    if (activeFilter && reports.length > 0) {
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
      // Always fetch all reports - this makes all photos visible to all users
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
    refreshUser(); // Also refresh user data when pulling down
    fetchReports();
  };

  const handleLogout = async () => {
    try {
      await authLogout(); // Use the logout function from auth context
      navigation.navigate('Welcome');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const handleReportPress = (report: TrashReport) => {
    navigation.navigate('Details', { report });
  };

  const handleStatusChange = async (reportId: number | string, newStatus: string) => {
    try {
      setLoading(true);
      const response = await updateTrashReport(reportId, { status: newStatus });
      
      // Update the reports list with the updated report
      if (response) {
        const updatedReports = reports.map(report => 
          report.id === reportId ? { ...report, status: newStatus } : report
        );
        setReports(updatedReports);
        Alert.alert('Success', `Report status updated to ${newStatus.replace('_', ' ').toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update report status');
    } finally {
      setLoading(false);
    }
  };

  // Helper function for translating status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'Докладвано';
      case 'IN_PROGRESS':
        return 'В процес';
      case 'CLEANED':
        return 'Почистено';
      case 'VERIFIED':
        return 'Проверено';
      default:
        return 'Докладвано';
    }
  };

  // Utility function to get colors for status
  const getStatusColors = (status: string) => {
    switch (status?.toUpperCase()) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderLogoutButton = () => (
    <TouchableOpacity 
      style={styles.logoutButton}
      onPress={handleLogout}
    >
      <LinearGradient
        colors={['#FF7043', '#F4511E']}
        style={styles.gradientButton}
      >
        <Ionicons name="log-out-outline" size={18} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.logoutButtonText}>Изход</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderGuestProfile = () => (
    <>
      <View style={styles.profileSection}>
        <LinearGradient
          colors={['rgba(59, 89, 152, 0.2)', 'rgba(74, 108, 179, 0.3)']}
          style={styles.profileBackground}
        >
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={60} color={ChemistryTheme.colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>Гост</Text>
              <Text style={styles.reportCount}>Преглеждате доклади на общността</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      
      <View style={styles.guestMessage}>
        <Text style={styles.guestMessageText}>
          Създайте профил, за да следите вашите доклади и да помогнете за по-чиста околна среда!
        </Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Welcome')}
        >
          <LinearGradient
            colors={[ChemistryTheme.colors.secondary, ChemistryTheme.colors.primary]}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Вход / Регистрация</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />
      
      <Text style={styles.sectionTitle}>Доклади на общността</Text>
    </>
  );

  const renderUserProfile = () => (
    <>
      <View style={styles.profileSection}>
        <LinearGradient
          colors={['rgba(59, 89, 152, 0.2)', 'rgba(74, 108, 179, 0.3)']}
          style={styles.profileBackground}
        >
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={60} color={ChemistryTheme.colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{user?.username || 'Потребител'}</Text>
              <Text style={styles.reportCount}>Добре дошли в общността!</Text>
              {renderLogoutButton()}
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Доклади на общността</Text>
    </>
  );

  const renderAdminProfile = () => (
    <>
      <View style={styles.profileSection}>
        <LinearGradient
          colors={['rgba(59, 89, 152, 0.2)', 'rgba(74, 108, 179, 0.3)']}
          style={styles.profileBackground}
        >
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Ionicons name="shield-checkmark" size={60} color={ChemistryTheme.colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{user?.username || 'Admin'}</Text>
              <Text style={styles.adminBadge}>Администратор</Text>
              {renderLogoutButton()}
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.divider} />

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
          <Text style={activeFilter === 'REPORTED' ? styles.activeFilterText : styles.filterText}>Докладвани</Text>
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
          <Text style={activeFilter === 'CLEANED' ? styles.activeFilterText : styles.filterText}>Почистени</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderReportCard = (report: TrashReport) => {
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

        {userRole === 'admin' && (
          <View style={styles.adminActions}>
            {status !== 'IN_PROGRESS' && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleStatusChange(report.id, 'IN_PROGRESS')}
              >
                <Text style={styles.actionButtonText}>Маркирай като в процес</Text>
              </TouchableOpacity>
            )}
            {status !== 'CLEANED' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.cleanedButton]}
                onPress={() => handleStatusChange(report.id, 'CLEANED')}
              >
                <Text style={styles.actionButtonText}>Маркирай като почистено</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {userRole === 'admin' ? 'Админ панел' : userRole === 'user' ? 'Моят профил' : 'Профил'}
        </Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {userRole === 'guest' && renderGuestProfile()}
        {userRole === 'user' && renderUserProfile()}
        {userRole === 'admin' && renderAdminProfile()}
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ChemistryTheme.colors.primary} />
            <Text style={styles.loadingText}>Зареждане на доклади...</Text>
          </View>
        ) : filteredReports.length > 0 ? (
          filteredReports.map(report => renderReportCard(report))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#BDBDBD" />
            <Text style={styles.emptyText}>Няма намерени доклади</Text>
            {userRole !== 'guest' && (
              <TouchableOpacity 
                style={styles.newReportButton}
                onPress={() => navigation.navigate('Camera')}
              >
                <LinearGradient
                  colors={[ChemistryTheme.colors.secondary, ChemistryTheme.colors.primary]}
                  style={styles.gradientButton}
                >
                  <Text style={styles.newReportButtonText}>Създай нов доклад</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120, // Extra space for bottom nav
  },
  profileSection: {
    marginBottom: 16,
  },
  profileBackground: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  profileContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reportCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  adminBadge: {
    fontSize: 14,
    color: ChemistryTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  guestMessage: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guestMessageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
  },
  activeFilterButton: {
    backgroundColor: '#f2f2f2',
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
    marginHorizontal: 16,
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
  adminActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2196F3',
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cleanedButton: {
    backgroundColor: ChemistryTheme.colors.primary,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
    marginBottom: 20,
  },
  newReportButton: {
    width: '80%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  newReportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 4,
    width: 100,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 6,
  },
});

export default ProfileScreen;