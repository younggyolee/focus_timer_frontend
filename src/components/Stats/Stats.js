import React from 'react';
import { View, Button, Text, Dimensions, Animated } from 'react-native';
import styles from './Stats.style.ios.js';
import AsyncStorage from '@react-native-community/async-storage';

export default function Stats({ navigation }) {

  const [startDate, setStartDate] = useState('2020-04-01');
  const [endDate, setEndDate] = useState('2020-04-13');

  // create a date range between startDate and endDate
  // fetch all events between this period

  // aggregate them by category

  // [ {title : 'coding', duration: 20 }, {title: 'workout', duration: 10}, ...]
  // should be ordered by duration

  // create bars using map

  return (
    <View style={styles.container}>
      <View>
        <Button
          title='Main'
          onPress={() => navigation.navigate('Main')}
        />
        <Text>
          Hello
        </Text>
        <Animated.View style={[styles.bar, styles.points, {width: 100}]} />
      </View>
    </View>
  );
};
