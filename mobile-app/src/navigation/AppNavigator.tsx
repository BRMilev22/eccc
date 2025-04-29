import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import DetailsScreen from '../screens/DetailsScreen';
import AddReportScreen from '../screens/AddReportScreen';
import { TrashReport } from '../services/api';

export type RootStackParamList = {
  Home: { refresh?: boolean } | undefined;
  Map: undefined;
  Details: { report: TrashReport };
  AddReport: { imageUri: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="AddReport" component={AddReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 