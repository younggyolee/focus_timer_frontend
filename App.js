import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, TextInput, View, Button, Switch, Text } from 'react-native';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TimePicker from 'react-native-simple-time-picker';
import AsyncStorage from '@react-native-community/async-storage';
import moment from 'moment';
const momentDurationFormatSetup = require("moment-duration-format");
import PushNotificationIOS from "@react-native-community/push-notification-ios";

const Stack = createStackNavigator();

function Home({ navigation }) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  PushNotificationIOS.addEventListener('localNotification', () => {
    console.log('notification received');
  });

  getBlocks = async() => {
    try {
      const blocks = await AsyncStorage.getItem('blocks');
      console.log(blocks);
    } catch(e) {
      console.error('Error while getting data \n', e);
    }
  }

  return(
    <View style={styles.container}>
      <View>
        <TextInput
          style={styles.titleInput}
          placeholder="Type title here"
          value={title}
          onChangeText={text => setTitle(text)}
        />
      </View>
      <View style={styles.durationContainer}>
        <TimePicker
          selectedHours={hours}
          selectedMinutes={minutes}
          hoursUnit=' hours'
          minutesUnit=' min'
          onChange={(hours, minutes) => {
            setHours(hours);
            setMinutes(minutes);
          }}
        />
      </View>
      <View>
        <Button
          title="Start"
          onPress={() => {
            navigation.navigate("Timer", {
              title,
              hours,
              minutes
            });
          }}
        />
      </View>
      <View>
        <Button
          title="console log blocks"
          onPress={() => {
            getBlocks();
          }}
        />
        <Button
          title="push notification"
          onPress={() => {
            const details = {
              alertBody: 'Testing',
              alertTitle: 'Sample'
            }
            PushNotificationIOS.presentLocalNotification(details);
          }}
        />
        <Button
          title="request permission"
          onPress={() => {
            PushNotificationIOS.requestPermissions();
          }}
        />
      </View>
    </View>
  )
}

function Timer({ route, navigation }) {
  const { title } = route.params;
  const secondsTotal = 3600 * route.params.hours + 60 * route.params.minutes;
  const [secondsLeft, setSecondsLeft] = useState(secondsTotal);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || secondsLeft === 0) return;

    const timer = setTimeout(() => {
      setSecondsLeft(secondsLeft - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    }
  }, [secondsLeft, isPaused]);

  removeBlocks = async() => {
    try {
      await AsyncStorage.removeItem('blocks');
      console.log("Data removed");
    } catch(e) {
      console.error('Error while removing data \n', e);
    }
  }

  storeBlock = async() => {
    const block = {
      title,
      duration: secondsTotal - secondsLeft, // use moment js duration here
      created_at: new Date().toISOString()
    }

    let blocks;
    try {
      blocks = await AsyncStorage.getItem('blocks');
      blocks = JSON.parse(blocks);
      if (blocks == null) {
        blocks = [];
      }
    } catch(e) {
      console.error('Error while getting data \n', e);
    }
    
    blocks.push(block);

    try {
      await AsyncStorage.setItem('blocks', JSON.stringify(blocks));
      console.log('Data stored!\n');
    } catch (e) {
      console.error('Error while storing data\n', e);
    }
  }

  return(
    <View style={{marginTop: 200, alignItems: 'center'}}>
      <Text>{title}</Text>
      <Text>{moment.duration(secondsLeft, "seconds").format("h:mm:ss")}</Text>
      <View
        style={{ alignItems: 'center', width: 100, backgroundColor: 'grey' }}
      >
        <Button
          title="Pause"
          onPress={() => {
            setIsPaused(!isPaused);
          }}
        />
        <Button
          title="Cancel"
          onPress={() => {
            navigation.navigate("Home");
            storeBlock();
          }}
        />
        <Button
          title="Empty blocks"
          onPress={() => {
            removeBlocks();
          }}
        />
      </View>
      
    </View>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        headerMode="none"
      >
        <Stack.Screen
          name="Home"
          component={Home}
        />
        <Stack.Screen
          name="Timer"
          component={Timer}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 200,
    fontSize: 20,
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  titleInput: {
    margin: 10,
    padding: 10,
    textAlign: 'center',
    fontSize: 20
  },
  durationContainer: {
    alignItems: 'center',
    width: 300
  },
  dateTimePicker: {
    width: 400
  }
});
