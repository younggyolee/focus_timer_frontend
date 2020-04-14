import React, { useState, useEffect } from 'react';
import { View, Button, Text, Dimensions, Animated, Picker } from 'react-native';
import styles from './StatsPerTag.style.ios.js';
import { ScrollView } from 'react-native-gesture-handler';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-community/async-storage';
import { getIsoDate } from '../../utils/dates';

export default function StatsPerTag({ route, navigation }) {
  const { tag } = route.params;
  const [barChartData, setBarChartData] = useState({});
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (barChartData.datasets) {
      setDataReady(true);
    }
  }, [barChartData])

  // get data for the tag
  // and aggregate per date
  useEffect(() => {
    (async() => {
      let eventsByTag;
      let events;
      try {
        eventsByTag = JSON.parse(await AsyncStorage.getItem('events_by_tag'));
        events = JSON.parse(await AsyncStorage.getItem('events'));
      } catch (err) {
        console.error(err);
      }
      console.log('eventsByTag', eventsByTag);
      console.log('events', events);
      const eventIds = eventsByTag[tag];
      const tagDurationByDate = {};
      for (let eventId of eventIds) {
        const event = events[eventId];
        console.log('event', event);
        const eventDate = getIsoDate(new Date(event.start_date).valueOf());
        const eventDuration = (new Date(event.end_date) - new Date(event.start_date)) / (1000 * 3600);
        if (tagDurationByDate[eventDate]) {
          tagDurationByDate[eventDate].duration =+ eventDuration;
        } else {
          tagDurationByDate[eventDate] = {duration: eventDuration};
        }
      }

      // manipulate data
      const dates = Object.keys(tagDurationByDate);
      dates.sort(function compare(a,b) {
        return (new Date(b) - new Date(a));
      });

      const data = {
        labels: [],
        datasets: [
          {
            data: []
          }
        ]
      };

      for (let date of dates) {
        data.labels.push(date);
        data.datasets[0].data.push(tagDurationByDate[dates].duration);
      }
      console.log(data);
      console.log(data.datasets[0].data);
      console.log(data.labels);
      setBarChartData(data);
    })();
  }, []);

  const screenWidth = Dimensions.get("window").width;
  const chartConfig = {
    backgroundColor: "#e26a00",
    backgroundGradientFrom: "#fb8c00",
    backgroundGradientTo: "#ffa726",
    decimalPlaces: 2, // optional, defaults to 2dp
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726"
    },
    barPercentage: 1 // change for bar width
  };

  // const sampleData = {
  //   labels: ["January", "February", "March", "April", "May", "June", "January", "February", "March", "April", "May", "June"],
  //   datasets: [
  //     {
  //       data: [20, 45, 28, 80, 99, 43, 20, 45, 28, 80, 99, 43]
  //     }
  //   ]
  // };
  // const sampleData = {
  //   labels: ['2020-04-14'],
  //   datasets: [
  //     {
  //       data:[2123456]
  //     }
  //   ]
  // };

  return (
    <View style={styles.container}>
      <Button
        title='Stats'
        onPress={() => navigation.navigate('StatsList')}
      />
      <Text>
        {tag}
      </Text>      
      {dataReady && (
        <ScrollView
          horizontal
        >
          <BarChart
            // style={graphStyle}
            data={barChartData}
            width={barChartData.datasets[0].data.length * 50 < screenWidth ? screenWidth : barChartData.datasets[0].data.length * 50} // change coeff 100
            // width={500}
            height={300}
            yAxisLabel="hrs"
            chartConfig={chartConfig}
            verticalLabelRotation={30}
          />
        </ScrollView>
      )}
    </View>
  );
};
