import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, Button, Vibration, ScrollView, Text } from 'react-native';
import TimePicker from 'react-native-simple-time-picker';
import AsyncStorage from '@react-native-community/async-storage';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import Voice from '@react-native-community/voice';
import processTextToCommand from '../../utils/nlp';
import { NativeModules } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker';
import Tts from 'react-native-tts';
import * as Calendar from 'expo-calendar';

const STATUS_TYPES = {
  INITIALIZED: 'INITIALIZED',
  WAITING: 'WAITING',
  DICTATING: 'DICTATING',
  COMMAND_PROCESSED: 'COMMAND_PROCESSED',
  STARTING_TIMER: 'STARTING_TIMER'
}

export default function Main({ navigation }) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [text, setText] = useState('');
  const [locale, setLocale] = useState('');
  const [status, setStatus] = useState(STATUS_TYPES.WAITING);
  const [calendarId, setCalendarId] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync();
        console.log('Here are all your calendars:');
        // console.log({ calendars });
        console.log(JSON.stringify(calendars, null, '\t'));
        setCalendarId(calendars[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    console.log(status, hours, minutes, title);
    if (status === STATUS_TYPES.COMMAND_PROCESSED && title) {
      console.log('tts');
      const hoursText = hours ? `${hours} hours` : '';
      const minutesText = minutes ? `${minutes} minutes` : '';
      const andText = hoursText && minutesText ? 'and' : '';
      const message = `Starting ${title} for ${hoursText} ${andText} ${minutesText}`;
      // read out the command
      // const voiceId;
      // Tts.voices().then(voices => voices.forEach(voice => {
      // }));
      setStatus(STATUS_TYPES.PREPARING_TO_START);
      
      Tts.speak(message);
      // move to timer after the speaking is ending
      navigation.navigate("Timer", {
        title,
        hours,
        minutes
      });
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
          if (response.duration || response.title) {
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
          }
      }, 2000);

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
            setStatus(STATUS_TYPES.DICTATING);
            // setIsDictating(true);
          }}
        />
        <Text>
          {status === STATUS_TYPES.DICTATING ? 'Speaking...' : ''}
          {/* {isDictating ? 'Speaking...' : ''} */}
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
          title='tts'
          
          onPress={async() => {
            // const voiceId;
            Tts.voices().then(voices => voices.forEach(voice => {
              
            }));
            Tts.speak('안녕하세요!', { iosVoiceId: 'com.apple.ttsbundle.Yuna-compact' });
          }
        }
        />
        <Button
          title='create calendar event'
          onPress={async() => {
            const details = {
              title: 'Sample event',
              startDate: new Date(),
              endDate: new Date().setHours(new Date().getHours() + 1)
            }
            const eventId = await Calendar.createEventAsync(
              calendarId,
              details
            );
            console.log('eventId', eventId);
          }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    fontSize: 20,
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  titleInput: {
    margin: 50,
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
