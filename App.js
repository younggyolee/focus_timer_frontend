import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, TextInput, View, Button, Switch, Text, Vibration } from 'react-native';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TimePicker from 'react-native-simple-time-picker';
import AsyncStorage from '@react-native-community/async-storage';
import moment from 'moment';
const momentDurationFormatSetup = require("moment-duration-format");
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import Voice from '@react-native-community/voice';

const Stack = createStackNavigator();

function Home({ navigation }) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  PushNotificationIOS.addEventListener('register', () => {
    console.log('remote notifcattion received');
  });

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechResults = onSpeechResults;
  }, []);

  function onSpeechStart(e) {
    console.log('onSpeechStart', e);
  }

  function onSpeechEnd(e) {
    console.log('onSpeechEnd: ', e);
  }

  function onSpeechRecognized(e) {
    console.log('onSpeechRecognized', e);
  }

  function onSpeechResults(e) {
    console.log('onSpeechResults: ', e);
    setTitle(e.value[0]);
  }

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
        {/* <Text>{result}</Text> */}
      </View>
      <View>
        
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
            Voice.destroy().then(Voice.removeAllListeners);
            navigation.navigate("Timer", {
              title,
              hours,
              minutes
            });
            setTitle('');
          }}
        />
      </View>
      <View>
        <Button
          title="Start recording"
          onPress={async () => await Voice.start('en-us')}
        />
        <Button
          title="Stop recording"
          onPress={async () => await Voice.stop()}
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
              alertTitle: 'Sample',
              sound: 'default'
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
        <Button
          title="vibrate"
          onPress={() => {
            Vibration.vibrate();
          }}
        />
        {/* <Button
          title="show result"
          onPress={() => console.log(result)}
        /> */}
      </View>
    </View>
  )
}

function Timer({ route, navigation }) {
  const { title } = route.params;
  const secondsTotal = 3600 * route.params.hours + 60 * route.params.minutes;
  const [secondsLeft, setSecondsLeft] = useState(secondsTotal);
  const [status, setStatus] = useState('ACTIVE');
  const [endTime, setEndTime] = useState(0);
  const [isKeptAwake, setIsKeptAwake] = useState(false);

  useEffect(() => {
    PushNotificationIOS.cancelAllLocalNotifications();

    if (status == 'ACTIVE') {
      const newEndTime = new Date().valueOf() + (secondsLeft * 1000);
      setEndTime(newEndTime);

      const details = {
        fireDate: new Date(newEndTime).valueOf(),
        alertTitle: `${title} has completed!`,
        alertBody: new Date(newEndTime).toString(),
        isSilent: false,
        applicationIconBadgeNumber: 0
      }
      PushNotificationIOS.scheduleLocalNotification(details);

      // I can add other notifications, like '1 hour remaining', or '10 minutes remaning',
      // or '1 hour passed' etc.
      console.log('newEndTime set, and also new notification set, also new setTimeout set');
    }
  }, [status]);

  useEffect(() => {
    // console.log('timer run', secondsLeft);
    if (!endTime || status !== 'ACTIVE') return;

    if (secondsLeft > 0) {
      const timer = setTimeout(() => {
        newSecondsLeft = (endTime - new Date().valueOf()) / 1000;
        newSecondsLeft >= 0 ? setSecondsLeft(newSecondsLeft) : setSecondsLeft(0);
      }, 1000);
      return () => {
        clearTimeout(timer);
      }
    }

    if (secondsLeft == 0 && status == 'ACTIVE') {
      Vibration.vibrate();
      console.log('VIBRATE!!!');
      setStatus('COMPLETED');
    }
  }, [secondsLeft, endTime, status]);

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
      <Button
        title='Keep Awake'
        onPress={()=>{
          console.log('keep awake touched');
          isKeptAwake ? deactivateKeepAwake() : activateKeepAwake() ;
          setIsKeptAwake(!isKeptAwake);
        }}
        className={isKeptAwake ? 'keep_awake_button_enabled' : 'keep_awake_button_disabled'}
      />
      <Text>{title}</Text>
      <Text>{new Date(endTime).toString()}</Text>
      <Text>{moment.duration(secondsLeft, "seconds").format("h:mm:ss")}</Text>
      <View
        style={{ alignItems: 'center', width: 100, backgroundColor: 'grey' }}
      >
        {
          (status === 'ACTIVE') &&
          <Button
            title='Pause'
            onPress={() => setStatus('PAUSED')}
          />
        }
        {
          (status === 'PAUSED') &&
          <Button
            title='Resume'
            onPress={() => setStatus('ACTIVE')}
          />
        }
        {
          ((status === 'PAUSED') || (status === 'COMPLETED')) &&
          <Button
            title="Cancel"
            onPress={() => {
              deactivateKeepAwake();
              storeBlock();
              navigation.navigate("Home");
            }}
          />
        }

        <Button
          title="Empty blocks for dev purposes"
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
