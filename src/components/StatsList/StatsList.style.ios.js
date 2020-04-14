import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    padding: 20
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  contentContainer: {
    height: '100%'
  },
  dateRangeButtonsContainer: {
    backgroundColor: 'lightgrey',
    padding: 3,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10
  },
  rangeButtonSelected:{
    borderRadius: 10,
    // borderWidth: 2,
    width: 90,
    backgroundColor: 'white'
  },
  rangeButton: {
    width: 90
  },
  tagsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  tagsHeaderText: {
    fontSize: 30
  },
  tagsHeaderDateRangeText: {
    fontSize: 20,
    color: 'grey'
  },
  barsContainer: {
    // padding: 20
  },
  bars: {
    paddingLeft: 20,
    justifyContent: 'center',
    flexDirection: 'column',
    marginTop: 10,
    height: 50,
    backgroundColor: 'grey',
    borderRadius: 20
  },
  barTitleText: {
    fontSize: 20
  },
  barDurationText: {
    fontSize: 15
  }
});
