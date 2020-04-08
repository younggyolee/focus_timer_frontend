import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, Button, Vibration, ScrollView, Text } from 'react-native';
import TimePicker from 'react-native-simple-time-picker';
import AsyncStorage from '@react-native-community/async-storage';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import Voice from '@react-native-community/voice';
// const { NerManager } = require('node-nlp-rn');

export default function Main({ navigation }) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isDictating, setIsDictating] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
  }, []);

  useEffect(() => {
    if (isDictating) {
      console.log('isDictating', isDictating);

      const timer = setTimeout(async() => {
        console.log('STOP LISTENING');
        await Voice.stop();
        setIsDictating(false);
      }, 3000);

      return function cleanUp() {
        clearTimeout(timer);
      }
    }
  }, [text, isDictating]);

  // function extractFromText(text){
  //   console.log('extracting...');
  //   const manager = new NerManager({ threshold: 0.8 });
  //   const onEntity = manager.addNamedEntity('onEntity', 'trim');
  //   onEntity.addBetweenCondition('en', 'on', 'for');
  //   onEntity.addAfterLastCondition('en', 'for');
  //   manager.findEntities(text, 'en')
  //   .then(entities => console.log(entities));
  // }

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
    console.log('onSpeechResults: ', e);
    setText(e.value[0]);
  }

  getBlocks = async() => {
    try {
      const blocks = await AsyncStorage.getItem('blocks');
      console.log(blocks);
    } catch(e) {
      console.error('Error while getting data', e);
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
          onPress={async () => {
            await Voice.start('en-us')
            setIsDictating(true);
          }}
        />
        <Text>
          {isDictating ? 'Speaking...' : ''}
        </Text>
        <Text>
          {text}
        </Text>
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
        <Button
          title="console extract"
          onPress={() => {
            extractFromText('Focus on swimming for 1 hour');
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
