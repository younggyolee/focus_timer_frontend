import React, { useState, useEffect } from 'react';
import { View, Button, Text, Dimensions, Animated, Picker, TouchableOpacity } from 'react-native';
import styles from './StatsList.style.ios.js';
import AsyncStorage from '@react-native-community/async-storage';
import { getDateRange, getIsoDate, addDays } from '../../utils/dates';
import moment from 'moment';
const momentDurationFormatSetup = require("moment-duration-format");

VIEW_TYPES = {
  MULTI_CATEGORIES: 'MULTI_CATEGORIES',
  SINGLE_CATEGORY: 'SINGLE_CATEGORY'
}

export default function StatsList({ navigation }) {
  const [startDate, setStartDate] = useState('2020-04-01');
  const [endDate, setEndDate] = useState('2020-04-13');
  const [eventsByTag, setEventsByTag] = useState([]);
  const [eventsByTagMaxDuration, setEventsByTagMaxDuration] = useState(10000);
  const [selectedDaysNum, setSelectedDaysNum] = useState(7);

  const screenWidth = Dimensions.get("window").width;
  
  useEffect(() => {
    (async() => {
      let eventsByDate;
      try {
        eventsByDate = JSON.parse(await AsyncStorage.getItem('events_by_date'));
      } catch (err) {
        console.error('Error while getting eventsByDate from AsyncStorage');
      }
      console.log('eventsByDate', eventsByDate);

      // create a date range between startDate and endDate
      const dateRange = getDateRange(startDate, endDate);

      const eventsByDateFiltered = {};
      // filter only events between this period
      for (date of dateRange) {
        if (date in eventsByDate) {
          eventsByDateFiltered[date] = eventsByDate[date];
        }
      }
      // aggregate them by category
      // get tags and their duration
      const durationByTagObj = {};
      const filteredDates = Object.keys(eventsByDateFiltered);
      let events;
      try {
        events = JSON.parse(await AsyncStorage.getItem('events'));
      } catch (err) {
        console.error('Error while getting events\n', err);
      }
      console.log('events', events);
      for (date of filteredDates) {
        for (eventId of eventsByDateFiltered[date]) {
          const event = events[eventId];
          const duration = (new Date(event.end_date).valueOf() - new Date(event.start_date).valueOf()) / 1000;
          for (tag of event.tags) {
            if (tag in durationByTagObj) {
              durationByTagObj[tag] += duration;
            } else {
              durationByTagObj[tag] = duration;
            }
          }
        }
      }
      // // durationByTagObj === { coding: 10000, workout: 4000 }
      // console.log('durationByTagObj', durationByTagObj);

      // should be ordered by duration
      const durationByTagArr = [];
      for (tag in durationByTagObj) {
        durationByTagArr.push({
          tag: tag,
          duration: durationByTagObj[tag]
        });
      }
      durationByTagArr.sort(function compare(a,b) {
        return (b.duration - a.duration);
      });
      const maxDuration = durationByTagArr.length && durationByTagArr[0]['duration'] || 3600;
      console.log('maxDuration', maxDuration);
      setEventsByTag(durationByTagArr);
      setEventsByTagMaxDuration(maxDuration);
    })();
  }, [startDate, endDate]);

  useEffect(() => {
    const today = getIsoDate(new Date().valueOf());
    const nthDayFromToday = getIsoDate(addDays(new Date().valueOf(), -selectedDaysNum));
    setStartDate(nthDayFromToday);
    setEndDate(today);
  }, [selectedDaysNum]);


  return (
    <View style={styles.container}>
      <View>
        <Button
          title='Main'
          onPress={() => navigation.navigate('Main')}
        />
        <Picker
          selectedValue={selectedDaysNum}
          onValueChange={
            (itemValue, itemIndex) => {
              console.log(itemValue);
              setSelectedDaysNum(itemValue);
            }
          }
        >
          <Picker.Item label='Today' value={1} />
          <Picker.Item label='Last 7 days' value={7} />
          <Picker.Item label='Last 30 days' value={30} />
        </Picker>

        <View>
          <Text>Tags</Text>
          {
            eventsByTag.map((event, index) => {
              return (
                <TouchableOpacity
                  onPress={() => 
                    navigation.navigate('StatsPerTag', {
                      tag: event.tag
                    })
                  }
                >
                <Animated.View
                  style={[
                    styles.bar,
                    styles.points,
                    { width:
                      (event.duration / eventsByTagMaxDuration) * screenWidth
                    }
                  ]}
                  key={index}
                >
                    <Text>
                      {event.tag} 
                      {moment.duration(event.duration, "seconds").format("h:mm:ss", {
                        trim: false
                      })}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })
          }
        </View>
      </View>
    </View>
  );
};
