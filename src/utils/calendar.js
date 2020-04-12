import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-community/async-storage';

export async function createCalendarAsync() {
  async function getDefaultCalendarSource() {
    const calendars = await Calendar.getCalendarsAsync();
    const defaultCalendars = calendars.filter(each => each.source.name === 'Default');
    return defaultCalendars[0].source;
  }

  const defaultCalendarSource =
  Platform.OS === 'ios'
    ? await getDefaultCalendarSource()
    : { isLocalAccount: true, name: 'Expo Calendar' };
  
  console.log('defaultCalendarSource', defaultCalendarSource);
  
  const newCalendarId = await Calendar.createCalendarAsync({
    title: 'Focus Timer Calendar',
    color: 'Blue',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultCalendarSource.id,
    source: defaultCalendarSource,
    name: 'internalCalendarName',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
  console.log('calendar created ', newCalendarId);
  await AsyncStorage.mergeItem(
    'calendar_settings',
    JSON.stringify({ calendar_id: newCalendarId })
  );
  return newCalendarId
};
