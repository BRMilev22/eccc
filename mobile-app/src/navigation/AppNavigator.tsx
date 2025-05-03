import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import DetailsScreen from '../screens/DetailsScreen';
import AddReportScreen from '../screens/AddReportScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import CameraScreen from '../screens/CameraScreen';
import PhotoReviewScreen from '../screens/PhotoReviewScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import { TrashReport } from '../services/api';
import { AuthProvider } from '../contexts/AuthContext';

export type RootStackParamList = {
  Welcome: undefined;
  Home: { refresh?: boolean } | undefined;
  Camera: undefined;
  Map: undefined;
  Details: { report: TrashReport };
  AddReport: { imageUri: string };
  PhotoReview: { imageUri: string };
  Profile: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fff' },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Details" component={DetailsScreen} />
          <Stack.Screen name="AddReport" component={AddReportScreen} />
          <Stack.Screen name="PhotoReview" component={PhotoReviewScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default AppNavigator; 