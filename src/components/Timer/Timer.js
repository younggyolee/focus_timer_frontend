import React, { useState, useEffect } from 'react';
import { View, Button, Text, Vibration, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import moment from 'moment';
const momentDurationFormatSetup = require("moment-duration-format");
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import styles from './Timer.style.ios.js';
import * as Calendar from 'expo-calendar';
import { createCalendarAsync } from '../../utils/calendar';
import { getIsoDate } from '../../utils/dates';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faInfinity, faBell, faPauseCircle, faStopCircle, faStop, faPlayCircle } from '@fortawesome/free-solid-svg-icons';
import { Audio } from 'expo-av';

const STATUS_TYPES = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
};

export default function Timer({ route, navigation }) {
  const { title, tags } = route.params;
  const secondsTotal = 3600 * route.params.hours + 60 * route.params.minutes;
  const [secondsLeft, setSecondsLeft] = useState(secondsTotal);
  const [status, setStatus] = useState(STATUS_TYPES.ACTIVE);
  const [endTime, setEndTime] = useState(0);
  const [isKeptAwake, setIsKeptAwake] = useState(false);
  const [calendarEventId, setCalendarEventId] = useState('');
  const [storageEventId, setStorageEventId] = useState('');
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  let soundObject;

  useEffect(() => {
    (async function() {
      PushNotificationIOS.cancelAllLocalNotifications();

      const calendarPermission = await Calendar.getCalendarPermissionsAsync()
      const isCalendarPermitted = calendarPermission.granted;
      let isCalendarEnabled;
      let calendarSettings;
      let calendarId;
      const today = getIsoDate(new Date().valueOf());
      let events = JSON.parse(await AsyncStorage.getItem('events'));
      const eventsByDate = JSON.parse(await AsyncStorage.getItem('events_by_date')) || {};
      const todayEvents = eventsByDate[today] || [];
      
      if (isCalendarPermitted) {
        calendarSettings = await AsyncStorage.getItem('calendar_settings');
        calendarSettings = JSON.parse(calendarSettings);
        calendarId = calendarSettings.calendar_id;
        isCalendarEnabled = calendarSettings.is_calendar_enabled;
        
        //check if calendar exists, and re-create one if it doesn't in calendar
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        let calendarExists;
        calendars.forEach(calendar => {
          if (calendar.id === calendarId) {calendarExists = true;}
        });
        if (!calendarExists) {
          calendarId = await createCalendarAsync();
          await AsyncStorage.mergeItem(
            'calendar_settings',
            JSON.stringify({ calendarId })
          );
        }
      }

      // When the timer started or resumed
      if (status === STATUS_TYPES.ACTIVE) {
        const newEndTime = new Date().valueOf() + (secondsLeft * 1000);
        setEndTime(newEndTime);
        const startTime = new Date().valueOf();

        // schedule a notification
        PushNotificationIOS.scheduleLocalNotification({
          fireDate: new Date(newEndTime).valueOf(),
          alertTitle: `${title} has completed!`,
          alertBody: new Date(newEndTime).toString(),
          isSilent: false,
          applicationIconBadgeNumber: 0
        });

        // save the event to device storage
        const eventId = uuidv4();
        todayEvents.push(eventId);
        try {
          await AsyncStorage.mergeItem(
            'events_by_date',
            JSON.stringify({[today]: todayEvents})
          );
          setStorageEventId(eventId);
        } catch (err) {
          console.error('Error while storing events_by_day\n', err);
        }

        // save the event details by its id separately
        try {
          await AsyncStorage.mergeItem(
            'events',
            JSON.stringify({
              [eventId]: {
                title,
                tags,
                start_date: new Date(startTime).toISOString(),
                end_date: new Date(newEndTime).toISOString()
              }
            })
          );
        } catch (err) {
          console.error('Error while storing event into events')
        }

        // save the event to device storage, categorizing by tag
        const storedTags = JSON.parse(await AsyncStorage.getItem('events_by_tag')) || {};
        for (tag of tags) {
          if (Object.keys(storedTags).includes(tag)) {
            storedTags[tag].push(eventId);
          } else {
            storedTags[tag] = [eventId];
          }
        }
        try {
          await AsyncStorage.mergeItem(
            'events_by_tag',
            JSON.stringify(storedTags)
          );
        } catch (err) {
          console.error('Error while storing event id to events_by_tag\n', err);
        }

        // create an event on calendar
        if (isCalendarPermitted && isCalendarEnabled && calendarId) {
          const eventId = await Calendar.createEventAsync(calendarSettings.calendar_id, {
            title,
            startDate: startTime,
            endDate: newEndTime
          });
          setCalendarEventId(eventId);
        }
      };

      if (status === STATUS_TYPES.PAUSED) {
        // update event on calendar
        if (isCalendarPermitted && isCalendarEnabled && calendarId) {
          Calendar.updateEventAsync(calendarEventId, {
            endDate: new Date()
          });
        }

        // update event in storage
        // search for the event
        todayEvents.forEach(event => {
          if (event.id === storageEventId) {
            event.end_date = new Date().toISOString();
          }
        });
        try {
          await AsyncStorage.mergeItem(
            'events',
            JSON.stringify({[today]: todayEvents})
          );
        } catch (err) {
          console.error('Error while updating end_date of a storage event\n', err);
        }
      }
    })();
  }, [status]);

  // Timer core logic
  useEffect(() => {
    if (endTime && status === STATUS_TYPES.ACTIVE) {
      if (secondsLeft > 0) {
        const timer = setTimeout(() => {
          newSecondsLeft = (endTime - new Date().valueOf()) / 1000;
          newSecondsLeft >= 0 ? setSecondsLeft(newSecondsLeft) : setSecondsLeft(0);
        }, 1000);
        return () => {
          clearTimeout(timer);
        }
      }

      if (secondsLeft == 0 && status === STATUS_TYPES.ACTIVE) {
        (async() => {
          Vibration.vibrate();
          soundObject = new Audio.Sound();
          await soundObject.loadAsync(require('../assets/sounds/alarm_bell.mp3'));
          await soundObject.playAsync();
          await soundObject.setOnPlaybackStatusUpdate((status) => {
            setIsSoundPlaying(status.didJustFinish);
          });
          setStatus(STATUS_TYPES.COMPLETED);
        })();
      }
    }
  }, [secondsLeft, endTime, status]);

  return(
    <SafeAreaView style={
      status === STATUS_TYPES.ACTIVE ?
        styles.safeAreaViewContainerActive:
        styles.safeAreaViewContainer
      }
    >
      <View 
        style={
          status === STATUS_TYPES.ACTIVE ?
            styles.containerActive :
            styles.container
        }
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={()=>{
              isKeptAwake ? deactivateKeepAwake() : activateKeepAwake();
              setIsKeptAwake(!isKeptAwake);
            }}
          >
            <FontAwesomeIcon
              icon={ faInfinity }
              size={ 60 }
              style={
                isKeptAwake ? styles.keepAwakeIconOn : styles.keepAwakeIconOff
              }
            />
          </TouchableOpacity>
        </View>
        <View style={styles.mainInfoContainer}>
          <Text style={styles.titleText}>
            {title}
          </Text>
          <Text style={styles.timeLeftText}>
            {moment.duration(secondsLeft, "seconds").format("hh:mm:ss", { trim: false })}
          </Text>
          <Text style={styles.endTimeText}>
            <FontAwesomeIcon
              icon={ faBell }
              style={styles.endTimeIcon}
            />
            {moment(new Date(endTime).toISOString()).format("A hh:mm")}
          </Text>
        </View>
        <View
          style={styles.activeButtonContainer}
        >
          {
            (status === STATUS_TYPES.ACTIVE) &&
            <TouchableOpacity
              onPress={() => setStatus(STATUS_TYPES.PAUSED)}
            >
              <FontAwesomeIcon icon={ faPauseCircle } size={ 80 }/>
            </TouchableOpacity>
          }
          {
            ((status === STATUS_TYPES.PAUSED) || (status === STATUS_TYPES.COMPLETED)) &&
            <TouchableOpacity
              onPress={async() => {
                deactivateKeepAwake();
                navigation.navigate("Main");
                if (isSoundPlaying) await soundObject.stopAsync();
              }}
            >
              <FontAwesomeIcon icon={ faStopCircle } size={ 80 } />
            </TouchableOpacity>
          }
          {
            (status === STATUS_TYPES.PAUSED) &&
            <TouchableOpacity
              onPress={() => setStatus(STATUS_TYPES.ACTIVE)}
            >
              <FontAwesomeIcon
                icon={ faPlayCircle }
                size={ 80 }
                style={ styles.playIcon }
              />
            </TouchableOpacity>
          }
        </View>
      </View>
    </SafeAreaView>
  );
};
