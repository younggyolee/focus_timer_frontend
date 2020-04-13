import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Main from './components/Main/Main';
import Timer from './components/Timer/Timer';
import Setting from './components/Setting/Setting';
import StatsList from './components/StatsList/StatsList';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        headerMode='none'
      >
        <Stack.Screen
          name='Main'
          component={Main}
        />
        <Stack.Screen
          name='Timer'
          component={Timer}
        />
        <Stack.Screen
          name='Setting'
          component={Setting}
        />
        <Stack.Screen
          name='StatsList'
          component={StatsList}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
