import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChemistryTheme } from '../theme/theme';
import ChemistryIcon from '../../assets/chemistry-icon';
import EcoIcon from '../../assets/eco-icon';

const { width } = Dimensions.get('window');

type BottomNavigationProps = {
  currentScreen: 'Camera' | 'Map' | 'Profile';
};

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentScreen }) => {
  const navigation = useNavigation();

  const navigateTo = (screen: string) => {
    if (currentScreen === screen) return;
    
    switch (screen) {
      case 'Camera':
        navigation.navigate('Camera' as never);
        break;
      case 'Map':
        navigation.navigate('Map' as never);
        break;
      case 'Profile':
        navigation.navigate('Profile' as never);
        break;
    }
  };

  const renderIcon = (screen: string, isActive: boolean) => {
    const color = isActive ? ChemistryTheme.colors.primary : '#757575';
    const size = isActive ? 28 : 24;
    
    switch (screen) {
      case 'Camera':
        return (
          <Ionicons
            name={isActive ? 'camera' : 'camera-outline'}
            size={size}
            color={color}
          />
        );
      case 'Map':
        return (
          <EcoIcon
            width={size}
            height={size}
            color={color}
          />
        );
      case 'Profile':
        return (
          <Ionicons
            name={isActive ? 'person' : 'person-outline'}
            size={size}
            color={color}
          />
        );
      default:
        return null;
    }
  };

  const getLabel = (screen: string) => {
    switch (screen) {
      case 'Camera': return 'Камера';
      case 'Map': return 'Eкология';
      case 'Profile': return 'Профил';
      default: return screen;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 1)']}
        style={styles.background}
      >
        {/* Center "floating" button for Camera */}
        {currentScreen !== 'Camera' && currentScreen !== 'Profile' && (
          <TouchableOpacity
            style={styles.centerButton}
            onPress={() => navigateTo('Camera')}
          >
            <LinearGradient
              colors={[ChemistryTheme.colors.primary, ChemistryTheme.colors.secondary]}
              style={styles.centerButtonGradient}
            >
              <Ionicons name="camera" size={28} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'Camera' && styles.activeNavItem]}
            onPress={() => navigateTo('Camera')}
          >
            {renderIcon('Camera', currentScreen === 'Camera')}
            <Text style={[styles.navText, currentScreen === 'Camera' && styles.activeNavText]}>
              {getLabel('Camera')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'Map' && styles.activeNavItem]}
            onPress={() => navigateTo('Map')}
          >
            {renderIcon('Map', currentScreen === 'Map')}
            <Text style={[styles.navText, currentScreen === 'Map' && styles.activeNavText]}>
              {getLabel('Map')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'Profile' && styles.activeNavItem]}
            onPress={() => navigateTo('Profile')}
          >
            {renderIcon('Profile', currentScreen === 'Profile')}
            <Text style={[styles.navText, currentScreen === 'Profile' && styles.activeNavText]}>
              {getLabel('Profile')}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  background: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  nav: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    borderBottomWidth: 3,
    borderBottomColor: ChemistryTheme.colors.primary,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#757575',
  },
  activeNavText: {
    color: ChemistryTheme.colors.primary,
    fontWeight: '600',
  },
  centerButton: {
    position: 'absolute',
    top: -20,
    left: (width - 56) / 2,
    width: 56,
    height: 56,
    borderRadius: 28,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  centerButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomNavigation; 