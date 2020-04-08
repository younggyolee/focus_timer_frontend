import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, Button, Text, Vibration } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import moment from 'moment';
const momentDurationFormatSetup = require("moment-duration-format");
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

export default function Timer({ route, navigation }) {
  const { title } = route.params;
  const secondsTotal = 3600 * route.params.hours + 60 * route.params.minutes;
  const [secondsLeft, setSecondsLeft] = useState(secondsTotal);
  const [status, setStatus] = useState('ACTIVE');
  const [endTime, setEndTime] = useState(0);
  const [isKeptAwake, setIsKeptAwake] = useState(false);

  useEffect(() => {
    PushNotificationIOS.cancelAllLocalNotifications();

    if (status == 'ACTIVE') {
      const newEndTime = new Date().valueOf() + (secondsLeft * 1000);
      setEndTime(newEndTime);

      const details = {
        fireDate: new Date(newEndTime).valueOf(),
        alertTitle: `${title} has completed!`,
        alertBody: new Date(newEndTime).toString(),
        isSilent: false,
        applicationIconBadgeNumber: 0
      }
      PushNotificationIOS.scheduleLocalNotification(details);

      console.log('newEndTime set, and also new notification set, also new setTimeout set');
    }
  }, [status]);

  useEffect(() => {
    if (!endTime || status !== 'ACTIVE') return;

    if (secondsLeft > 0) {
      const timer = setTimeout(() => {
        newSecondsLeft = (endTime - new Date().valueOf()) / 1000;
        newSecondsLeft >= 0 ? setSecondsLeft(newSecondsLeft) : setSecondsLeft(0);
      }, 1000);
      return () => {
        clearTimeout(timer);
      }
    }

    if (secondsLeft == 0 && status == 'ACTIVE') {
      Vibration.vibrate();
      console.log('VIBRATE!!!');
      setStatus('COMPLETED');
    }
  }, [secondsLeft, endTime, status]);

  removeBlocks = async() => {
    try {
      await AsyncStorage.removeItem('blocks');
      console.log("Data removed");
    } catch(e) {
      console.error('Error while removing data \n', e);
    }
  }

  storeBlock = async() => {
    const block = {
      title,
      duration: secondsTotal - secondsLeft,
      created_at: new Date().toISOString()
    }

    let blocks;
    try {
      blocks = await AsyncStorage.getItem('blocks');
      blocks = JSON.parse(blocks);
      if (blocks == null) {
        blocks = [];
      }
    } catch(e) {
      console.error('Error while getting data \n', e);
    }
    
    blocks.push(block);

    try {
      await AsyncStorage.setItem('blocks', JSON.stringify(blocks));
      console.log('Data stored!');
    } catch (e) {
      console.error('Error while storing data\n', e);
    }
  }

  return(
    <View style={{marginTop: 200, alignItems: 'center'}}>
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
        style={{ alignItems: 'center', width: 100, backgroundColor: 'grey' }}
      >
        {
          (status === 'ACTIVE') &&
          <Button
            title='Pause'
            onPress={() => setStatus('PAUSED')}
          />
        }
        {
          (status === 'PAUSED') &&
          <Button
            title='Resume'
            onPress={() => setStatus('ACTIVE')}
          />
        }
        {
          ((status === 'PAUSED') || (status === 'COMPLETED')) &&
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
          title="Empty blocks for dev purposes"
          onPress={() => {
            removeBlocks();
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {

  }
});
