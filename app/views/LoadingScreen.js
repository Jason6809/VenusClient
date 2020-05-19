import React, {useEffect} from 'react';
import {ActivityIndicator, StatusBar} from 'react-native';

import {Screen, View, Text, Image} from '@shoutem/ui';

import Colors from '../constants/Colors';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'LoadingScreen: ';

const LoadingScreen = props => {
  console.log(SCREEN, 'props = ', props);

  useEffect(() => {
    createNotificationChannel();
    
    const onAuthStateChanged = AUTH.onAuthStateChanged(firebaseUser => {
      const TAG = 'onAuthStateChanged: ';
      console.log(SCREEN, TAG, 'start... ');
      console.log(SCREEN, TAG, 'firebaseUser = ', firebaseUser);

      if (firebaseUser) {
        checkPermission(firebaseUser);
      }

      setTimeout(() => {
        props.navigation.navigate(firebaseUser ? 'App' : 'Auth');
      }, 2000);

      console.log(SCREEN, TAG, 'finish... ');
    });

    return () => {
      const TAG = 'useEffect Cleanup: ';
      console.log(SCREEN, TAG, 'start...');

      if (onAuthStateChanged) {
        console.log(SCREEN, TAG, 'onAuthStateChanged = ', onAuthStateChanged);

        onAuthStateChanged();
      }
    };
  }, []);

  async function checkPermission(firebaseUser) {
    const TAG = 'checkPermission: ';
    console.log(SCREEN, TAG, 'start... ');

    const enabled = await MESSAGING.hasPermission();
    if (enabled) {
      console.log(SCREEN, TAG, 'enabled = ', enabled);
      updateToken(firebaseUser);
    } else {
      console.log(SCREEN, TAG, 'enabled = ', enabled);
      requestPermission(firebaseUser);
    }
  }

  async function updateToken(firebaseUser) {
    const TAG = 'updateToken: ';
    console.log(SCREEN, TAG, 'start... ');

    var fcmToken = await MESSAGING.getToken();
    console.log(SCREEN, TAG, 'fcmToken = ', fcmToken);

    if (fcmToken && firebaseUser) {
      DATABASE.collection('UserStatus')
        .doc(firebaseUser.uid)
        .update({
          fcmToken,
        });
    }
  }

  async function requestPermission(firebaseUser) {
    const TAG = 'requestPermission: ';
    console.log(SCREEN, TAG, 'start... ');

    try {
      await MESSAGING.requestPermission();
      updateToken(firebaseUser);
    } catch (error) {
      // statements
      console.error(SCREEN, TAG, 'error = ', error);
    }
  }

  function createNotificationChannel() {
    // Build a android notification channel
    const channel = new firebase.notifications.Android.Channel(
      'Main', // channelId
      'Main Channel', // channel name
      firebase.notifications.Android.Importance.High, // channel importance
    ).setDescription('Used for getting Main notifications'); // channel description

    // Create the android notification channel
    NOTIFICATIONS.android.createChannel(channel);
  }

  return (
    <Screen style={{backgroundColor: 'white'}}>
      <StatusBar
        backgroundColor="white"
        barStyle="dark-content"
        animated={true}
      />
      <View styleName="flexible stretch vertical v-center h-center">
        <Image source={require('../assets/loader_large.gif')} />
        <Text style={{color: Colors.Dark}} styleName="md-gutter-top">
          LOADING
        </Text>
      </View>
    </Screen>
  );
};

export default LoadingScreen;
