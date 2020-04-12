export function getIsoDate(time) {
  let timeObj = new Date(time);
  timeObj = new Date(timeObj.getTime() - (timeObj.getTimezoneOffset() * 60000))
  return timeObj.toISOString().split('T')[0];
};
