import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, TextInput, View, Button, Switch, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

function Home({ navigation }) {
  const [title, setTitle] = useState('');
  const [show, setShow] = useState(false);
  const [duration, setDuration] = useState(new Date(2000, 1, 1, 1, 0, 0));
  const [init, setInit] = useState(false);

  const toggleSwitch = () => setShow(previousState => !previousState);

  useEffect(() => {
    setTimeout(() => {
      setInit(true);
    }, 1000);
    
    // setDuration(new Date(2000, 1, 1, 0, 0, 0));
    // setDuration(new Date(2000, 1, 1, 1, 0, 0));
  }, [])

  function handleChange(event, selectedDuration) {
    setDuration(selectedDuration);
    console.log('handleChange triggered', duration.getHours(), duration.getMinutes());
  }

  return(
    <View style={styles.container}>
      <View>
        <TextInput
          style={styles.titleInput}
          placeholder="Type title here"
          value={title}
          onChangeText={text => setTitle(text)}
        />
      </View>
      <View style={styles.durationContainer}>
        <Text>Timer</Text>
        <Switch
          onValueChange={toggleSwitch}
          value={show}
        />
        {show &&
          <DateTimePicker
            style={styles.dateTimePicker}
            value={duration}
            mode='countdown'
            onChange={handleChange}
          />
        }
      </View>
      <View>
        <Button
          title="Start"
          onPress={() => navigation.navigate("Timer", {
            title,
            duration
          })}
        />
      </View>
    </View>
  )
}

function Timer({ route, navigation }) {
  const { title, duration } = route.params;
  
  const endTime = new Date();
  endTime.setHours(endTime.getHours() + duration.getMinutes());
  endTime.setMinutes(endTime.getMinutes() + duration.getMinutes());

  return(
    <View style={{marginTop: 200, alignItems: 'center'}}>
      <Text>{title}</Text>
      <Text>{endTime.toISOString()}</Text>
      <View
        style={{ alignItems: 'center', width: 100, backgroundColor: 'grey' }}
      >
        <Button
          title="Cancel"
          onPress={() => navigation.navigate("Home")}
        />
      </View>
      
    </View>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        headerMode="none"
      >
        <Stack.Screen
          name="Home"
          component={Home}
          // options={{title: "Welcome"}}
        />
        <Stack.Screen
          name="Timer"
          component={Timer}
          // options={{title: "Timer"}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 200,
    fontSize:20
  },
  titleInput: {
    margin: 10,
    padding: 10,
    textAlign: 'center',
    fontSize: 20
  },
  durationContainer: {
    alignItems: 'center'
  },
  dateTimePicker: {
    width: 400
  }
});
