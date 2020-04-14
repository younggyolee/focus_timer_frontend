import React, { useState, useEffect } from 'react';
import { TextInput, View, Button, ScrollView, Text, Alert, Linking, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import Voice from '@react-native-community/voice';
import processTextToCommand from '../../utils/nlp';
import { NativeModules } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker';
import Tts from 'react-native-tts';
import styles from './Main.style.ios.js';
import {check, PERMISSIONS, RESULTS} from 'react-native-permissions';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faCog, faChartBar, faPlayCircle, faMicrophone } from '@fortawesome/free-solid-svg-icons'
import { getIsoDate } from '../../utils/dates';

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
  const [queuedTimer, setQueuedTimer] = useState();

  useEffect(() => {
    (async() => {
      const hasLaunched = await(AsyncStorage.getItem('has_launched'));
      if (!hasLaunched) {
        AsyncStorage.setItem('calendar_settings', JSON.stringify({
          calendar_id: '',
          is_calendar_enabled: false,
          permission_requested: false
        }));
        AsyncStorage.setItem('has_launched', 'true');

        AsyncStorage.setItem('events_by_date')
      }
    })();
  }, []);

  useEffect(() => {
    const extractedTags = [];
    for (word of title.split(' ')) {
      if (word.includes('#')) {
        extractedTags.push(word);
      }
    }
    setTags(extractedTags);
  }, [title]);

  useEffect(() => {
    if (status === STATUS_TYPES.STARTING_TIMER) {
      if (title) {
        // const hoursText = hours ? 
        //   (hours > 1 ? `${hours} hours` : `${hours} hour`) :
        //   '';
        // const minutesText = minutes ? `${minutes} minutes` : '';
        // const andText = hoursText && minutesText ? 'and' : '';
        // const message = `Beginning ${title} for ${hoursText} ${andText} ${minutesText}`;
        // setStatus(STATUS_TYPES.STARTING_TIMER);
  
        // Tts.speak(message);

        PushNotificationIOS.checkPermissions(result => {
          if (!result.alert || !result.sound) {
            PushNotificationIOS.requestPermissions();
          }
        });
        navigation.navigate("Timer", {
          title,
          tags,
          hours,
          minutes
        });
      }
      setStatus(STATUS_TYPES.WAITING);
    }
  }, [status]);

  useEffect(() => {
    console.log(status, hours, minutes, title);
    if (status === STATUS_TYPES.COMMAND_PROCESSED) {
      const hoursText = hours ? `${hours} hours` : '';
      const minutesText = minutes ? `${minutes} minutes` : '';
      const andText = hoursText && minutesText ? 'and' : '';
      const message = `Starting ${title} for ${hoursText} ${andText} ${minutesText}`;
      setStatus(STATUS_TYPES.STARTING_TIMER);

      Tts.speak(message);
    }
  }, [status, hours, minutes, title]);

  // Trigger two changes on start-up,
  // to deal with an issue presumably from SWIFT API
  // where the first two changes don't trigger onChange
  useEffect(() => {
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
      console.log("cancel", event);
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
      // console.log(text);
      // extract tags
      const extractedTags = [];
      for (word of text.split(' ')) {
        if (word.includes('#')) {
          extractedTags.push(word);
          console.log(word);
        }
      }
      setTags(extractedTags);

      const timer = setTimeout(async() => {
        await Voice.stop();
        const response = await processTextToCommand(text, locale);
          if (response.duration && response.title) {
            console.log('ok', response);
            const totalSeconds = Number(response.duration);
            const hrs = Math.floor(totalSeconds / 3600);
            const mins = (totalSeconds - (hrs * 3600)) / 60;

            setTitle(response.title);
            setTags(response.tags);
            setHours(hrs);
            setMinutes(mins);
            setStatus(STATUS_TYPES.COMMAND_PROCESSED);
          } else {
            console.log('could not process text');
            setStatus(STATUS_TYPES.WAITING);
          }
          setText('');
      }, 3000);
      setQueuedTimer(timer);

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

  async function onRecordingIconTouch() {
    const permission = await check(PERMISSIONS.IOS.SPEECH_RECOGNITION);
    switch (permission) {
      case RESULTS.UNAVAILABLE:
        console.log('This feature is not available on this device');
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
            {text: 'Cancel', style: 'cancel'},
            {text: 'Settings', onPress: () => Linking.openSettings()},
          ],
          { cancelable: false }
        );
        return;
    }
  }

  async function onCancelRecordingIconTouch() {
    clearTimeout(queuedTimer);
    setStatus(STATUS_TYPES.WAITING);
    setText('');
    await Voice.stop();
  }

  return(
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Setting')}
          >
            <FontAwesomeIcon icon={ faCog } size={ 40 }/>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('StatsList')}
          >
            <FontAwesomeIcon icon={ faChartBar } size={ 40 }/>
          </TouchableOpacity>
        </View>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Type title here"
            value={title}
            onChangeText={text => setTitle(text)}
          />
        </View>
        <View>
          {tags && tags.map((tag, index) => 
            <Text style={styles.tagTexts} key={index}>
              {tag}
            </Text>
          )}
        </View>
        <View>
          <Text style={styles.listeningText}>
            {status === STATUS_TYPES.DICTATING ? 'Listening...' : ' '}
          </Text>
          <Text style={styles.dictatedText}>
            {status === STATUS_TYPES.DICTATING ? text : ' '}
          </Text>
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
        <View style={styles.mainButtonsContainer}>
          {status !== STATUS_TYPES.DICTATING && 
          (
            <TouchableOpacity
              onPress={onRecordingIconTouch}
            >
              <FontAwesomeIcon icon={ faMicrophone } size={ 60 } />
            </TouchableOpacity>
          )
          }
          { status === STATUS_TYPES.DICTATING &&
          (
            <TouchableOpacity
              onPress={onCancelRecordingIconTouch}
            >
              <FontAwesomeIcon
                icon={ faMicrophone }
                size={ 60 }
                style={styles.cancelRecordingIcon}
              />
            </TouchableOpacity>
          )
          }
          
          <TouchableOpacity 
            onPress={() => {
              setStatus(STATUS_TYPES.STARTING_TIMER);
            }}
          >
            <FontAwesomeIcon icon={ faPlayCircle } size={ 60 } />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
