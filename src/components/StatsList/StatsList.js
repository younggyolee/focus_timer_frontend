import React, { useState, useEffect } from 'react';
import { View, Button, Text, Dimensions, Animated, Picker } from 'react-native';
import styles from './StatsList.style.ios.js';
import AsyncStorage from '@react-native-community/async-storage';
import { getDateRange, getIsoDate, addDays } from '../../utils/dates';
import moment from 'moment';
const momentDurationFormatSetup = require("moment-duration-format");
import { BarChart } from 'react-native-chart-kit';

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
  const [view, setView] = useState('');

  const screenWidth = Dimensions.get("window").width;
  
  useEffect(() => {
    (async() => {
      let events;
      try {
        events = JSON.parse(await AsyncStorage.getItem('events'));
      } catch (err) {
        console.error('Error while getting events from AsyncStorage');
      }
      console.log('events', events);
      // create a date range between startDate and endDate
      const dateRange = getDateRange(startDate, endDate);
      console.log('dateRange', dateRange);

      const dateFilteredEvents = {};
      // filter only events between this period
      for (date of dateRange) {
        if (date in events) {
          dateFilteredEvents[date] = events[date];
        }
      }
      console.log('dateFilteredEvents', dateFilteredEvents);

      // // aggregate them by category
      // // get tags and their duration
      const durationByTagObj = {};
      const filteredDates = Object.keys(dateFilteredEvents);
      for (date of filteredDates) {
        for (event of dateFilteredEvents[date]) {
          const duration = new Date(event.end_date) - new Date(event.start_date);
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
      console.log('durationByTagObj', durationByTagObj);

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
      console.log('durationByTagArr', durationByTagArr);
      console.log(Object.keys(durationByTagArr[0]));
      console.log(Object.keys(durationByTagArr[0])[0]);
      const maxDuration = durationByTagArr[0].duration;
      // maxDuration = 10000;
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
                    {moment.duration(event.duration/1000, "seconds").format("h:mm:ss", {
                      trim: false
                    })}
                  </Text>
                </Animated.View>
              );
            })
          }
        </View>
        
        <Button
          title='check eventsByTags and eventsByTagsMax'
          onPress={() => {
            console.log(eventsByTag);
            console.log(eventsByTagMaxDuration)
          }}
        />
        <Button
          title='input sample dataset'
          onPress={async() => {
            await AsyncStorage.setItem('events', JSON.stringify({
              "2020-04-13":[{"id":"dc102170-e82a-4de1-a93d-e4b634833688","title":"","tags":['#coding'],"end_date":"2020-04-13T07:45:04.844Z","start_date":"2020-04-13T06:45:05.892Z"}],
              "2020-04-05":[{"id":"dc102170-e82a-4de1-a93d-e4b634833688","title":"","tags":['#cooking'],"end_date":"2020-04-05T07:45:04.844Z","start_date":"2020-04-05T06:43:05.892Z"}]
            }));
            console.log('new data entered');
          }}
        />
        <Button
          title='check events in storage'
          onPress={async() => {
            const events = await AsyncStorage.getItem('events');
            console.log(events);
          }}
        />
      </View>
    </View>
  );
};
