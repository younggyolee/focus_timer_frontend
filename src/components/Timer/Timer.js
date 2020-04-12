import React, { useState, useEffect } from 'react';
import { View, Button, Text, Vibration } from 'react-native';
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

const STATUS_TYPES = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
};

export default function Timer({ route, navigation }) {
  const { title } = route.params;
  const { tags } = route.params;
  const secondsTotal = 3600 * route.params.hours + 60 * route.params.minutes;
  const [secondsLeft, setSecondsLeft] = useState(secondsTotal);
  const [status, setStatus] = useState(STATUS_TYPES.ACTIVE);
  const [endTime, setEndTime] = useState(0);
  const [isKeptAwake, setIsKeptAwake] = useState(false);
  const [calendarEventId, setCalendarEventId] = useState('');
  const [storageEventId, setStorageEventId] = useState('');

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
      let todayEvents = (events && events[today]) ? events[today]: [];

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
            'campaign_settings',
            JSON.stringify({ calendarId })
          );
          console.log('calendar created');
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

        // saves the event to device storage
        const eventId = uuidv4();
        const event = {
          id: eventId,
          title,
          tags,
          start_date: new Date(startTime).toISOString(),
          end_date: new Date(newEndTime).toISOString()
        };
        todayEvents.push(event);
        try {
          await AsyncStorage.mergeItem(
            'events',
            JSON.stringify({[today]: todayEvents})
          );
          setStorageEventId(eventId);
        } catch (err) {
          console.error('Error while storing event\n', err);
        }

        // create an event on calendar
        if (isCalendarPermitted && isCalendarEnabled && calendarId) {
          const eventId = await Calendar.createEventAsync(calendarSettings.calendar_id, {
            title,
            startDate: startTime,
            endDate: newEndTime
          });
          // console.log('calendar event created');
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
        console.log('todayEvents', todayEvents);
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

  useEffect(() => {
    // Timer core logic
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
        Vibration.vibrate();
        console.log('VIBRATE!!!');
        setStatus(STATUS_TYPES.COMPLETED);
      }
    }
  }, [secondsLeft, endTime, status]);

  storeBlock = async() => {
    const block = {
      title,
      duration: secondsTotal - secondsLeft,
      created_at: new Date().toISOString()
    }

    let blocks;
    try {
      blocks = await AsyncStorage.getItem('calendar_settings');
      blocks = JSON.parse(blocks);
      if (blocks == null) {
        blocks = [];
      }
    } catch(e) {
      console.error('Error while getting data \n', e);
    }

    try {
      await AsyncStorage.setItem('blocks', JSON.stringify(blocks));
      console.log('Data stored!');
    } catch (e) {
      console.error('Error while storing data\n', e);
    }
  }

  return(
    <View style={styles.container}>
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
        style={styles.buttonsContainer}
      >
        {
          (status === STATUS_TYPES.ACTIVE) &&
          <Button
            title='Pause'
            onPress={() => {
              setStatus(STATUS_TYPES.PAUSED);
            }}
          />
        }
        {
          (status === STATUS_TYPES.PAUSED) &&
          <Button
            title='Resume'
            onPress={() => setStatus(STATUS_TYPES.ACTIVE)}
          />
        }
        {
          ((status === STATUS_TYPES.PAUSED) || (status === STATUS_TYPES.COMPLETED)) &&
          <Button
            title="Cancel"
            onPress={() => {
              deactivateKeepAwake();
              storeBlock();
              navigation.navigate("Main");
            }}
          />
        }

        <Button
          title="Empty events"
          onPress={async() => {
            try {
              await AsyncStorage.removeItem('events');
              console.log("Data removed");
            } catch(e) {
              console.error('Error while removing data \n', e);
            }        
          }}
        />
        <Button
          title="console log events"
          onPress={async() => {
            try {
              console.log(await AsyncStorage.getItem('events'));
            } catch(e) {
              console.error('error');
            }        
          }}
        />
      </View>
    </View>
  );
};
