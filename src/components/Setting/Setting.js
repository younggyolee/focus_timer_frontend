import React, { useState, useEffect } from 'react';
import { View, Text, Button, Switch, Alert, Linking } from 'react-native';
import styles from './Setting.style.ios.js';
import AsyncStorage from '@react-native-community/async-storage';
import * as Calendar from 'expo-calendar';
import { createCalendarAsync } from '../../utils/calendar';

export default function Setting({ navigation }) {

  const [isCalendarEnabled, setIsCalendarEnabled] = useState(false);

  useEffect(() => {
    (async() => {
      const calendarSettings = JSON.parse(await AsyncStorage.getItem('calendar_settings'));
      setIsCalendarEnabled(calendarSettings.is_calendar_enabled);
    })();
  }, []);

  async function toggleCalendarSwitch() {
    const toggled = !isCalendarEnabled;

    if (toggled) {
      let calendar_settings = await AsyncStorage.getItem('calendar_settings');
      calendar_settings = JSON.parse(calendar_settings);
      calendarId = calendar_settings.calendar_id;

      const calendarPermission = await Calendar.getCalendarPermissionsAsync()
      if (!(calendarPermission.granted)) {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        AsyncStorage.mergeItem('campaign_settings', JSON.stringify({
          permission_requested: true
        }));
        if (status !== 'granted') {
          // trigger popup to let user know that
          // calendar permission should be configured manually
          Alert.alert(
            'Calendar Access Required',
            'Please turn on Calendar Access in iPhone "Settings" to use the calendar syncing feature',
            [
              {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
              {text: 'OK', onPress: () => Linking.openSettings()},
            ],
            { cancelable: false }
          );
          return;
        }
      }

      // check if calendar id exists in asyncstorage & it really exists in the calendar too
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      let calendarExists;
      calendars.forEach(calendar => {
        if (calendar.id === calendarId) {calendarExists = true;}
      });
      if (!calendarExists) {
        calendarId = await createCalendarAsync();
        await AsyncStorage.mergeItem(
          'campaign_settings',
          JSON.stringify({calendar_id : calendarId})
        );
      }
    }

    (async() => {
      await AsyncStorage.mergeItem(
        'calendar_settings',
        JSON.stringify({ is_calendar_enabled: toggled })
      );
    })();
    setIsCalendarEnabled(toggled);
  }

  return(
    <View style={styles.container}>
      <Text>Setting</Text>
      <Button
        title='Main'
        onPress={() => navigation.navigate('Main')}
      />
      <View>
        <Text>Add events to calendar</Text>
        <Switch
          value={isCalendarEnabled}
          onValueChange={toggleCalendarSwitch}
        />
      </View>

      <Button
        title='check calendar_settings'
        onPress={async() => {
          console.log(await AsyncStorage.getItem('calendar_settings'));
        }}
      />
    </View>
  );
}
