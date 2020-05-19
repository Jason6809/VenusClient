import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  AsyncStorage,
} from 'react-native';

import {
  Screen,
  View,
  Text,
  Caption,
  Tile,
  Button,
  Icon,
  Image,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import BookingPanel from '../components/BookingPanel';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'BookingScreen: ';

const BookingScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const [loading, setLoading] = useState(true);
  const [bookingRequest, setBookingRequest] = useState(null);

  useEffect(() => {
    const currentUser = AUTH.currentUser;

    const BookingRequestRef = DATABASE.collection('BookingRequest');
    const onBookingRequestSnapshot = BookingRequestRef.doc(
      currentUser.uid,
    ).onSnapshot(async doc => {
      const TAG = 'onBookingRequestSnapshot: ';
      console.log(SCREEN, TAG, 'start... ');

      setLoading(true);

      if (doc.exists) {
        console.log(SCREEN, TAG, 'doc = ', doc);

        const bookingRequestUid = doc.id;
        const {stylistUid} = doc.data();

        const UserRef = DATABASE.collection('Users');

        try {
          var userProfile = await UserRef.doc(currentUser.uid).get();
          console.log(SCREEN, TAG, 'userProfile = ', userProfile);
        } catch (e) {
          // statements
          console.error(SCREEN, TAG, 'userProfile:error... ', e);
        }

        try {
          var stylist = await UserRef.doc(stylistUid).get();
          console.log(SCREEN, TAG, 'stylist = ', stylist);
        } catch (e) {
          // statements
          console.error(SCREEN, TAG, 'stylist:error... ', e);
        }

        setBookingRequest({
          bookingRequestUid,
          customer: {...userProfile.data()},
          stylist: {...stylist.data()},
          ...doc.data(),
        });
      } else {
        setBookingRequest(null);
      }

      setLoading(false);
    });

    return () => {
      const TAG = 'useEffect Cleanup: ';
      console.log(SCREEN, TAG, 'start...');

      if (onBookingRequestSnapshot) {
        console.log(
          SCREEN,
          TAG,
          'onBookingRequestSnapshot = ',
          onBookingRequestSnapshot,
        );

        onBookingRequestSnapshot();
      }
    };
  }, []);

  useEffect(() => {
    const currentUser = AUTH.currentUser;

    const BookingRequestRef = DATABASE.collection('BookingRequest');
    const onBookingRequestChanges = BookingRequestRef.onSnapshot(
      async querySnapshot => {
        const TAG = 'onBookingRequestChanges: ';
        console.log(SCREEN, TAG, 'start... ');

        for (const docChange of querySnapshot.docChanges) {
          console.log(SCREEN, TAG, 'docChange = ', docChange);

          if (docChange.doc.id === currentUser.uid) {
            try {
              var isCancelledBySelf = await AsyncStorage.getItem(
                'isCancelledBySelf',
              );
            } catch (e) {
              console.error(SCREEN, TAG, 'AsyncStorage.getItem: error...', e);
            }

            const {stylist, status} = docChange.doc.data();
            switch (docChange.type) {
              case 'modified':
                if (status) {
                  const title = 'Hurray !';
                  const body = `${stylist.profile.firstName} ${
                    stylist.profile.lastName
                  } has accept yours Booking Request`;

                  displayNotification(title, body);
                }
                break;
              case 'removed':
                console.log(
                  SCREEN,
                  TAG,
                  'isCancelledBySelf = ',
                  isCancelledBySelf,
                );

                if (isCancelledBySelf && isCancelledBySelf === 'true') {
                  try {
                    await AsyncStorage.removeItem('isCancelledBySelf');
                  } catch (e) {
                    console.error(
                      SCREEN,
                      TAG,
                      'AsyncStorage.removeItem: error...',
                      e,
                    );
                  }
                } else {
                  const title = 'Ouch !';
                  const body = `${stylist.profile.firstName} ${
                    stylist.profile.lastName
                  } has reject yours Booking Request`;

                  displayNotification(title, body);
                }
                break;
              default:
                // statements_def
                break;
            }
          }
        }
      },
    );

    return () => {
      const TAG = 'useEffect Cleanup: ';
      console.log(SCREEN, TAG, 'start...');

      if (onBookingRequestChanges) {
        console.log(
          SCREEN,
          TAG,
          'onBookingRequestChanges = ',
          onBookingRequestChanges,
        );
      }
    };
  }, []);

  function displayNotification(title, body) {
    const notification = new firebase.notifications.Notification()
      .setNotificationId('1')
      .setTitle(title)
      .setBody(body)
      .android.setChannelId('Main')
      .android.setAutoCancel(true);

    NOTIFICATIONS.displayNotification(notification);
  }

  return (
    <Screen style={styles.screen}>
      <StatusBar
        backgroundColor={Colors.Misty_Rose}
        barStyle="dark-content"
        animated={true}
      />
      <View styleName="flexible md-gutter">
        {loading && (
          <Tile style={styles.tile} styleName="md-gutter">
            <View styleName="stretch horizontal v-center h-center">
              <Image source={require('../assets/loader_small.gif')} />
              <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
                LOADING...
              </Caption>
            </View>
          </Tile>
        )}

        {!loading && (
          <BookingPanel
            navigation={props.navigation}
            bookingRequest={bookingRequest}
          />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.Misty_Rose,
  },
  tile: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    elevation: 5,
  },
});

export default BookingScreen;
