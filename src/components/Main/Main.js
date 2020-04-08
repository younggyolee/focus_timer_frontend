import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, Button, Vibration, ScrollView, Text } from 'react-native';
import TimePicker from 'react-native-simple-time-picker';
import AsyncStorage from '@react-native-community/async-storage';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import Voice from '@react-native-community/voice';
import processTextToCommand from '../../utils/nlp';
import { NativeModules } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Main({ navigation }) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [isDictating, setIsDictating] = useState(false);
  const [text, setText] = useState('');
  const [locale, setLocale] = useState('');
  const [initialized, setIntialized] = useState(false);

  useEffect(() => {
    setIntialized(true);
    setHours(0);
    setMinutes(0);
    setTimeout(() => {
      setHours(1);
      setMinutes(0);
    });
    // console.log('init');
    // console.log(date.getHours(), date.getMinutes());
  }, []);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    const locale = NativeModules.SettingsManager.settings.AppleLanguages // "fr_FR"
    setLocale(locale[0]);
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
        <DateTimePicker
          value={initialized ? new Date(2020, 1, 1, hours, minutes, 0) : new Date(2020, 1, 1, hours, minutes, 1)}
          mode='countdown'
          onChange={(event, selectedDate) => {
            // setDate(selectedDate);
            console.log('changed', hours, minutes, initialized);
            setHours(selectedDate.getHours());
            setMinutes(selectedDate.getMinutes());
          }}
        />
        {/* <TimePicker
          selectedHours={hours}
          selectedMinutes={minutes}
          hoursUnit=' hours'
          minutesUnit=' min'
          onChange={(hours, minutes) => {
            setHours(hours);
            setMinutes(minutes);
          }}
        /> */}
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
            await Voice.start(locale);
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
          onPress={async() => {
            const response = await processTextToCommand(text);
            if (response.result === 'ok') {
              console.log('ok', response);
              const totalMinutes = Number(response.duration);
              console.log(totalMinutes, totalMinutes / 60);
              const hrs = Math.floor(totalMinutes / 3600);
              const mins = totalMinutes - (hrs * 3600);

              console.log(hrs, mins);
              setTitle(response.title);
              setHours(hrs);
              setMinutes(mins);
            } else {
              console.log('could not process text');
            }
          }}
        />
        <Button
          title='settime'
          onPress={() => {
              setHours(3);
              setMinutes(10);
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
    // alignItems: 'center',
    width: 300
  },
  dateTimePicker: {
    width: 400
  }
});
