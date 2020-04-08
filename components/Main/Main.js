import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, Button, Vibration, ScrollView, Text } from 'react-native';
import TimePicker from 'react-native-simple-time-picker';
import AsyncStorage from '@react-native-community/async-storage';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import Voice from '@react-native-community/voice';

export default function Main({ navigation }) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [commandText, setCommandText] = useState('');

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    // Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.start();
    console.log('Voice recognition started');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsUserSpeaking(false);
      console.log('STOP LISTENING');
    }, 3000);
    
    return function cleanUp() {
      clearTimeout(timer);
      // console.log('cleanup');
    }
  }, [title]);

  function onSpeechStart(e) {
    console.log('onSpeechStart', e);
  }

  function onSpeechRecognized(e) {
    console.log('onSpeechRecognized: ', e);
  }

  function onSpeechEnd(e) {
    console.log('onSpeechEnd: ', e);
  }

  function onSpeechError(e) {
    console.log('onSpeechError: ', e);
  }

  function onSpeechResults(e) {
    const triggerWord = 'hi timer';
    console.log('onSpeechResults: ', e);
    setTitle(e.value[0]);
    
    if (!isUserSpeaking && e.value[0].includes(triggerWord)) {
      console.log('trigger word detected!');
      setStart(e.value[0].indexOf(triggerWord));
      setIsUserSpeaking(true);
    }
    if (isUserSpeaking) {
      setEnd(e.value[0].length);
    }
    setCommandText(e.value[0].slice(start, end));
  }

  // function onSpeechPartialResults(e) {
  //   console.log('onSpeechPartialResults: ', e);
  // }

  getBlocks = async() => {
    try {
      const blocks = await AsyncStorage.getItem('blocks');
      console.log(blocks);
    } catch(e) {
      console.error('Error while getting data \n', e);
    }
  }

  return(
    <ScrollView style={styles.container}>
      <View>
        <TextInput
          style={styles.titleInput}
          placeholder="Type title here"
          value={title}
          onChangeText={text => setTitle(text)}
        />
        <Text>
          {commandText}
        </Text>
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
            Voice.stop();
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 100,
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
