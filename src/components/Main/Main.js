import React, { useState, useEffect } from 'react';
import { TextInput, View, Button, Vibration, ScrollView, Text, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import Voice from '@react-native-community/voice';
import processTextToCommand from '../../utils/nlp';
import { NativeModules } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker';
import Tts from 'react-native-tts';
import styles from './Main.style.ios.js';
import {check, PERMISSIONS, RESULTS} from 'react-native-permissions';

const STATUS_TYPES = {
  WAITING: 'WAITING',
  DICTATING: 'DICTATING',
  COMMAND_PROCESSED: 'COMMAND_PROCESSED',
  STARTING_TIMER: 'STARTING_TIMER'
};

export default function Main({ navigation }) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [text, setText] = useState('');
  const [locale, setLocale] = useState('');
  const [status, setStatus] = useState(STATUS_TYPES.WAITING);

  useEffect(() => {
    // check if it's a first run, and create initial data on asyncstorage
    (async() => {
      const hasLaunched = await(AsyncStorage.getItem('has_launched'));
      if (!hasLaunched) {
        AsyncStorage.setItem('calendar_settings', JSON.stringify({
          calendar_id: '',
          is_calendar_enabled: false,
          permission_requested: false
        }));
        AsyncStorage.setItem('has_launched', 'true');
      }
    })();
  }, []);

  useEffect(() => {
    console.log(status);
    if (status === STATUS_TYPES.STARTING_TIMER) {
      PushNotificationIOS.checkPermissions(result => {
        if (!result.alert || !result.sound) {
          console.log('asking for permission');
          PushNotificationIOS.requestPermissions();
        }
      });
  
      navigation.navigate("Timer", {
        title,
        hours,
        minutes
      });
      setStatus(STATUS_TYPES.WAITING);
    }
  }, [status]);

  useEffect(() => {
    console.log(status, hours, minutes, title);
    if (status === STATUS_TYPES.COMMAND_PROCESSED) {
      console.log('tts');
      const hoursText = hours ? `${hours} hours` : '';
      const minutesText = minutes ? `${minutes} minutes` : '';
      const andText = hoursText && minutesText ? 'and' : '';
      const message = `Starting ${title} for ${hoursText} ${andText} ${minutesText}`;
      // select among available voice
      // const voiceId;
      // Tts.voices().then(voices => voices.forEach(voice => {
      // }));
      setStatus(STATUS_TYPES.STARTING_TIMER);
      
      Tts.speak(message);
      // move to timer after the speaking is ending
    }
  }, [status, hours, minutes, title])

  useEffect(() => {
    // to counter a bug of SWIFT datetimepicker API
    setHours(0);
    setMinutes(0);
    setTimeout(() => {
      setHours(1);
      setMinutes(0);
    });
  }, []);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    const locale = NativeModules.SettingsManager.settings.AppleLanguages
    setLocale(locale[0]);

    Tts.addEventListener('tts-start', (event) => {
      console.log("start", event);
    });
    Tts.addEventListener('tts-finish', (event) => {
      console.log("finish", event);
    });
    Tts.addEventListener('tts-cancel', (event) => {
      console.log("cancel", event)
    });
    return function cleanup() {
      Voice.removeAllListeners();
      Tts.removeEventListener('tts-start');
      Tts.removeEventListener('tts-finish');
      Tts.removeEventListener('tts-cancel');
    }
  }, []);

  useEffect(() => {
    if (status === STATUS_TYPES.DICTATING) {
      const timer = setTimeout(async() => {
        console.log('STOP LISTENING');

        await Voice.stop();
        const response = await processTextToCommand(text, locale);
          if (response.duration && response.title) {
            console.log('ok', response);
            const totalSeconds = Number(response.duration);
            const hrs = Math.floor(totalSeconds / 3600);
            const mins = (totalSeconds - (hrs * 3600)) / 60;

            setTitle(response.title);
            setHours(hrs);
            setMinutes(mins);
            setStatus(STATUS_TYPES.COMMAND_PROCESSED);
          } else {
            console.log('could not process text');
            setStatus(STATUS_TYPES.WAITING);
          }
      }, 3000);

      return function cleanUp() {
        clearTimeout(timer);
      }
    }
  }, [text, status]);

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
          value={new Date(2020, 1, 1, hours, minutes, 0)}
          mode='countdown'
          onChange={(event, selectedDate) => {
            setHours(selectedDate.getHours());
            setMinutes(selectedDate.getMinutes());
          }}
          textColor='#000000'
        />
      </View>
      <View>
        <Button
          title="Start"
          onPress={() => {
            setStatus(STATUS_TYPES.STARTING_TIMER);
          }}
        />
      </View>
      <View>
        <Button
          title="Start recording"
          onPress={async () => {
            const permission = await check(PERMISSIONS.IOS.SPEECH_RECOGNITION);
            switch (permission) {
              case RESULTS.UNAVAILABLE:
                console.log(
                  'This feature is not available on this device'
                );
                return;
              case RESULTS.DENIED:
              case RESULTS.GRANTED:
                await Voice.start(locale);
                setStatus(STATUS_TYPES.DICTATING);
                return;
              case RESULTS.BLOCKED:
                // pop up + link to settings
                Alert.alert(
                  'Speech Recognition Access Required',
                  'Please turn on Access for Speech Recognition in iPhone "Settings" to use the calendar syncing feature',
                  [
                    {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                    {text: 'Settings', onPress: () => Linking.openSettings()},
                  ],
                  { cancelable: false }
                );
                return;
            }
          }}
        />
        <Text>
          {status === STATUS_TYPES.DICTATING ? 'Speaking...' : ''}
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
          title='Setting'
          onPress={() => navigation.navigate('Setting')}
        />
        <Button
          title='console log calendar_settings'
          onPress={async() => console.log(await AsyncStorage.getItem('calendar_settings'))}
        />
        <Button
          title='console log status'
          onPress={() => console.log(status)}
        />
      </View>
    </ScrollView>
  );
};
