import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    padding: 20
  },
  headerContainer: {
    flexDirection: 'row'
  },
  mainButtonContainer: {
    flex: 1
  },
  settingsHeaderText: {
    fontSize: 40,
    flex: 2,
  },
  contentContainer: {
    borderTopWidth: 3,
    marginTop: 20
  },
  calendarSettingContainer: {
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  calendarSettingTextContainer: {
    justifyContent: 'center'
  },
  calendarSettingText: {
    fontSize: 25
  }
});
