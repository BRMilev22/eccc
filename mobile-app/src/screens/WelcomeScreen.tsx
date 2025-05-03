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
      setError('Please enter both username and password');
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
        setError('Invalid username or password');
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Login failed. Please try again.');
        console.error('Login error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username || !password || !email) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Use real registration via API
      const userData = await registerUser(username, password, email);
      
      // Show success message and switch to login
      Alert.alert(
        'Registration Successful',
        'Your account has been created. You will be logged in automatically.',
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
        setError('Username or email already exists');
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Registration failed. Please try again.');
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
      <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
        <LinearGradient
          colors={['#66BB6A', '#4CAF50']}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={handleGuestLogin}>
        <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoginScreen = () => (
    <View style={styles.loginContainer}>
      <Text style={styles.loginHeader}>Login</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
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
          colors={['#66BB6A', '#4CAF50']}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <View style={styles.registerPrompt}>
        <Text style={styles.registerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => setMode('register')}>
          <Text style={styles.registerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={() => setMode('welcome')} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegisterScreen = () => (
    <View style={styles.loginContainer}>
      <Text style={styles.loginHeader}>Create Account</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
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
          colors={['#66BB6A', '#4CAF50']}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <View style={styles.registerPrompt}>
        <Text style={styles.registerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => setMode('login')}>
          <Text style={styles.registerLink}>Login</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={() => setMode('welcome')} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.backgroundGradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>TrashTracker</Text>
              <Text style={styles.tagline}>Help keep our environment clean</Text>
            </View>

            {mode === 'welcome' && renderWelcomeScreen()}
            {mode === 'login' && renderLoginScreen()}
            {mode === 'register' && renderRegisterScreen()}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 60,
    backgroundColor: 'white',
    padding: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    width: '80%',
    height: 54,
    borderRadius: 27,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  loginHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    fontSize: 16,
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    marginTop: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerPrompt: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#666',
    fontSize: 16,
  },
});

export default WelcomeScreen; 