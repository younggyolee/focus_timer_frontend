import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Main from './components/Main/Main';
import Timer from './components/Timer/Timer';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        headerMode="none"
      >
        <Stack.Screen
          name="Main"
          component={Main}
        />
        <Stack.Screen
          name="Timer"
          component={Timer}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
