import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, Button, Switch, Text, Vibration } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import TimePicker from 'react-native-simple-time-picker';
import AsyncStorage from '@react-native-community/async-storage';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import Voice from '@react-native-community/voice';

export default function Main({ navigation }) {
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
      </View>
    </View>
  );
};

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
