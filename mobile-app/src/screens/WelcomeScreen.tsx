import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { loginUser, registerUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ChemistryTheme } from '../theme/theme';
import SchoolLogoIcon from '../../assets/school-logo-icon';
import ChemistryIcon from '../../assets/chemistry-icon';
import EcoIcon from '../../assets/eco-icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get authentication state from context
  const { isAuthenticated, user, login } = useAuth();
  
  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      // Navigate to Camera screen for all users, including admins
      navigation.replace('Camera');
    }
  }, [isAuthenticated, user, navigation]);

  const handleGetStarted = () => {
    setMode('login');
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Моля, въведете и двете потребителско име и парола');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Use real authentication via API
      const userData = await loginUser(username, password);
      
      // Update auth context
      await login(userData);
      
      // Navigate to Camera for all users, including admins
      navigation.replace('Camera');
    } catch (err) {
      // Check for specific error types
      if (err.response && err.response.status === 401) {
        setError('Невалидно потребителско име или парола');
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Грешка при вход. Моля, опитайте отново.');
        console.error('Login error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username || !password || !email) {
      setError('Моля, попълнете всички полета');
      return;
    }

    if (password.length < 6) {
      setError('Паролата трябва да бъде поне 6 символа');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Use real registration via API
      const userData = await registerUser(username, password, email);
      
      // Show success message and switch to login
      Alert.alert(
        'Регистрация успешна',
        'Вашият акаунт е създаден. Ще бъдете автоматично влязли в системата.',
        [{ 
          text: 'OK', 
          onPress: async () => {
            // Auto-login after registration
            await login(userData);
            navigation.replace('Camera');
          } 
        }]
      );
    } catch (err) {
      // Check for specific error types
      if (err.response && err.response.status === 409) {
        setError('Потребителско име или имейл вече съществува');
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Грешка при регистрация. Моля, опитайте отново.');
        console.error('Registration error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    navigation.replace('Camera');
  };

  const renderWelcomeScreen = () => (
    <View style={styles.buttonContainer}>
      <View style={styles.iconRow}>
        <ChemistryIcon width={36} height={36} color={ChemistryTheme.colors.primary} />
        <EcoIcon width={36} height={36} color={ChemistryTheme.colors.success} />
      </View>
      
      
      <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
        <LinearGradient
          colors={[ChemistryTheme.colors.primary, ChemistryTheme.colors.secondary]}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>Вход</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={handleGuestLogin}>
        <Text style={styles.secondaryButtonText}>Продължете като гост</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoginScreen = () => (
    <View style={styles.loginContainer}>
      <Text style={styles.loginHeader}>Вход</Text>
      
      {error ? <Text style={styles.errorText}>Грешка при вход</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Потребителско име"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Парола"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      
      <TouchableOpacity 
        style={[styles.loginButton, loading && styles.disabledButton]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <LinearGradient
          colors={[ChemistryTheme.colors.primary, ChemistryTheme.colors.secondary]}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Вход</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <View style={styles.registerPrompt}>
        <Text style={styles.registerText}>Не имате акаунт? </Text>
        <TouchableOpacity onPress={() => setMode('register')}>
          <Text style={styles.registerLink}>Регистрация</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={() => setMode('welcome')} style={styles.backButton}>
        <Text style={styles.backText}>Назад</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegisterScreen = () => (
    <View style={styles.loginContainer}>
      <Text style={styles.loginHeader}>Създаване на акаунт</Text>
      
      {error ? <Text style={styles.errorText}>Грешка при регистрация</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Потребителско име"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Имейл"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Парола"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      
      <TouchableOpacity 
        style={[styles.loginButton, loading && styles.disabledButton]} 
        onPress={handleRegister}
        disabled={loading}
      >
        <LinearGradient
          colors={[ChemistryTheme.colors.primary, ChemistryTheme.colors.secondary]}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Регистрация</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <View style={styles.registerPrompt}>
        <Text style={styles.registerText}>Вече имате акаунт? </Text>
        <TouchableOpacity onPress={() => setMode('login')}>
          <Text style={styles.registerLink}>Вход</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={() => setMode('welcome')} style={styles.backButton}>
        <Text style={styles.backText}>Назад</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <LinearGradient
        colors={[ChemistryTheme.colors.background, '#ffffff']}
        style={styles.backgroundGradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <SchoolLogoIcon size={100} />
                <Text style={styles.logoText}>Химия за околната среда</Text>
              </View>
              
              {mode === 'welcome' && renderWelcomeScreen()}
              {mode === 'login' && renderLoginScreen()}
              {mode === 'register' && renderRegisterScreen()}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 16,
    color: ChemistryTheme.colors.primary,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: ChemistryTheme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: ChemistryTheme.colors.text,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.8,
  },
  loginHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: ChemistryTheme.colors.primary,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: ChemistryTheme.colors.primary,
    fontSize: 16,
  },
  loginContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerPrompt: {
    flexDirection: 'row',
    marginTop: 10,
  },
  registerText: {
    color: ChemistryTheme.colors.text,
  },
  registerLink: {
    color: ChemistryTheme.colors.primary,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backText: {
    color: ChemistryTheme.colors.primary,
    fontWeight: '500',
  },
  errorText: {
    color: ChemistryTheme.colors.error,
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default WelcomeScreen; 