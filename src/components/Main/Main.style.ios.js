import { StyleSheet } from 'react-native';

export default  StyleSheet.create({
  headerContainer:{
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  container: {
    fontSize: 20,
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  textInputContainer: {
    width: '100%',
  },
  titleInput: {
    borderStyle: 'solid',
    borderBottomWidth: 2,
    margin: 50,
    padding: 10,
    textAlign: 'center',
    fontSize: 30
  },
  tagTexts: {
    fontSize: 30,
    color: '#E54B4B'
  },
  durationContainer: {
    width: 300
  },
  dateTimePicker: {
    width: 400
  },
  mainButtonsContainer: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});
