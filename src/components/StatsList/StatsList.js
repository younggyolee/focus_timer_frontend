import React, { useState, useEffect } from 'react';
import { View, Button, Text, Dimensions, Animated, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import styles from './StatsList.style.ios.js';
import AsyncStorage from '@react-native-community/async-storage';
import { getDateRange, getIsoDate, addDays } from '../../utils/dates';
import moment from 'moment';
const momentDurationFormatSetup = require("moment-duration-format");
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';

VIEW_TYPES = {
  MULTI_CATEGORIES: 'MULTI_CATEGORIES',
  SINGLE_CATEGORY: 'SINGLE_CATEGORY'
}

export default function StatsList({ navigation }) {
  const today = getIsoDate(new Date().valueOf());
  const screenWidth = Dimensions.get("window").width;

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [eventsByTag, setEventsByTag] = useState([]);
  const [eventsByTagMaxDuration, setEventsByTagMaxDuration] = useState(10000);
  const [selectedDaysNum, setSelectedDaysNum] = useState(0);

  useEffect(() => {
    (async() => {
      let eventsByDate;
      try {
        eventsByDate = JSON.parse(await AsyncStorage.getItem('events_by_date'));
      } catch (err) {
        console.error('Error while getting eventsByDate from AsyncStorage\n', err);
      }

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
      for (date of filteredDates) {
        for (eventId of eventsByDateFiltered[date]) {
          const event = events[eventId];
          const duration = (new Date(event.end_date).valueOf() - new Date(event.start_date).valueOf()) / 1000;
          for (tag of event.tags) {
            if (tag in durationByTagObj) {
              ('adding duration', tag)
              durationByTagObj[tag] += duration;
            } else {
              ('creating duration', tag)
              durationByTagObj[tag] = duration;
            }
          }
        }
      }

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
      setEventsByTag(durationByTagArr);
      setEventsByTagMaxDuration(maxDuration);
    })();
  }, [startDate, endDate]);

  useEffect(() => {
    const nthDayFromToday = getIsoDate(addDays(new Date().valueOf(), -selectedDaysNum));
    setStartDate(nthDayFromToday);
    setEndDate(today);
  }, [selectedDaysNum]);

  const bgColors = [
    'rgb(183, 206, 178)',
    'rgb(188, 204, 222)',
    'rgb(211, 135, 131)',
    'rgb(239, 239, 197)',
    'rgb(251, 202, 142)',
    'rgb(235, 230, 133)',
    'rgb(186, 188, 190)',
    'rgb(209, 122, 128)'
  ];

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Main')}
          >
            <FontAwesomeIcon icon={ faHome } size={ 50 } />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.contentContainer}>
          <View style={styles.dateRangeButtonsContainer}>
            <View style={selectedDaysNum === 0 ? styles.rangeButtonSelected : styles.rangeButton}>
              <Button
                title='D'
                color='black'
                onPress={()=>setSelectedDaysNum(0)}
              />
            </View>
            <View style={selectedDaysNum === 6 ? styles.rangeButtonSelected : styles.rangeButton}>
              <Button
                title='W'
                color='black'
                onPress={()=>setSelectedDaysNum(6)}
              />
            </View>
            <View style={selectedDaysNum === 30 ? styles.rangeButtonSelected : styles.rangeButton}>
              <Button
                title='M'
                color='black'
                onPress={()=>setSelectedDaysNum(30)}
              />
            </View>
            <View style={selectedDaysNum === 365 ? styles.rangeButtonSelected : styles.rangeButton}>
              <Button
                title='Y'
                color='black'
                onPress={()=>setSelectedDaysNum(365)}
              />
             </View>
          </View>
          <View style={styles.tagsHeaderContainer}>
            <Text style={styles.tagsHeaderText}>Tags</Text>
          </View>
          <View>
            <Text style={styles.tagsHeaderDateRangeText}>
              {moment(startDate).format('MMM DD, YYYY')}-{moment(endDate).format('MMM DD, YYYY')}
            </Text>
          </View>
          <View>
            {
              eventsByTag.map((event, index) => {
                const barWidth = (event.duration / eventsByTagMaxDuration) * screenWidth * 0.8;
                return (
                  <TouchableOpacity
                    style={styles.barContainer}
                    onPress={() => 
                      navigation.navigate('StatsPerTag', {
                        tag: event.tag
                      })
                    }
                    key={index}
                  >
                    <Animated.View
                      style={[
                        styles.bars,
                        {
                          width: barWidth,
                          backgroundColor: bgColors[index % 8]
                        }
                      ]}
                      key={index}
                    >
                    </Animated.View>
                    <Text style={styles.barTitleText}>
                      {event.tag}
                    </Text>
                    <Text style={styles.barDurationText}>
                      {moment.duration(event.duration, "seconds").format("hh:mm:ss", {
                        trim: false
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })
            }
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};
