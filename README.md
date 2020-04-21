# Get-it-done Timer
I made this timer as there was no iOS app on the market that precisely satisfied my needs.

## Preview
![](preview_1.gif)

## Download here
<!-- App store link with App Store icon -->
App Store link will be added here later.

## Stories

### Why was I unhappy with the existing timer apps?

- Some were **too simple**, and didn't offer spent-hour tracking (iPhone default Timer),
- Some were **not customisable** (many Pomodoro timers, which can only be set for 25 minutes or 50 minutes for each session)
- And no timer offered **synchronization** with iPhone's default **Apple Calendar** app, which I use to manage my daily schedule.

### So I made a timer which,
- is insanely **simple**,
- can **track** how many hours I spent per category per day,
- can encourage me to **focus**
- can automatically sync with **Apple Calendar**

### Technical stuffs

### Challenges
- React-native Libraries
    - Installing `node-nlp-rn`
    - library setup - need to configure iOS Swift files (not too crazy, but still taking time)
    - errors in library (e.g. datetimepicker countdown mode)
- Mobile Specific issues
    - permissions issues (need to think of many cases)
    - background & settimeout not working
    - 'Hey Siri' - (wait for trigger word/ 1 min limit on iOS) - (Google Assistant?)
- Build issues
    - apple developer account, xcode, app store connect test flight crash, etc. + expo
- etc
    - AsyncStorage - only JSON format (need to be parsed)