import { StyleSheet } from 'react-native';

export default  StyleSheet.create({
  container: {
    fontSize: 20,
    padding: 30
  },
  headerContainer:{
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between'
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
  listeningText: {
    fontSize: 20
  },
  dictatedText: {
    fontSize: 20,
    color: 'grey'
  },
  durationContainer: {
    justifyContent: 'center'
  },
  mainButtonsContainer: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  cancelRecordingIcon: {
    color: 'red'
  }
});
