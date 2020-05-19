import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  SectionList,
  RefreshControl,
  FlatList,
  AsyncStorage,
} from 'react-native';

import {
  Screen,
  View,
  Title,
  Subtitle,
  Text,
  Tile,
  Caption,
  Button,
  Icon,
  Card,
  Image,
  Divider,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import RentalPanel from '../components/RentalPanel';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'RentalScreen: ';

const RentalScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const [loading, setLoading] = useState(true);
  const [rentalRequest, setRentalRequest] = useState(null);

  useEffect(() => {
    const currentUser = AUTH.currentUser;

    const RentalRequestRef = DATABASE.collection('RentalRequest');
    const onRentalRequestSnapshot = RentalRequestRef.doc(
      currentUser.uid,
    ).onSnapshot(async doc => {
      const TAG = 'onRentalRequestSnapshot: ';
      console.log(SCREEN, TAG, 'start... ');

      setLoading(true);

      if (doc.exists) {
        console.log(SCREEN, TAG, 'doc = ', doc);

        const rentalRequestUid = doc.id;
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

        setRentalRequest({
          rentalRequestUid,
          customer: {...userProfile.data()},
          stylist: {...stylist.data()},
          ...doc.data(),
        });
      } else {
        setRentalRequest(null);
      }

      setLoading(false);
    });

    return () => {
      const TAG = 'useEffect Cleanup: ';
      console.log(SCREEN, TAG, 'start...');

      if (onRentalRequestSnapshot) {
        console.log(
          SCREEN,
          TAG,
          'onRentalRequestSnapshot = ',
          onRentalRequestSnapshot,
        );

        onRentalRequestSnapshot();
      }
    };
  }, []);

  useEffect(() => {
    const currentUser = AUTH.currentUser;

    const RentalRequestRef = DATABASE.collection('RentalRequest');
    const onRentalRequestChanges = RentalRequestRef.onSnapshot(
      async querySnapshot => {
        const TAG = 'onRentalRequestChanges: ';
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
                  } has accept yours Rental Request`;

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
                  } has reject yours Rental Request`;

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

      if (onRentalRequestChanges) {
        console.log(
          SCREEN,
          TAG,
          'onRentalRequestChanges = ',
          onRentalRequestChanges,
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
    <Screen style={{backgroundColor: Colors.Misty_Rose}}>
      <StatusBar
        backgroundColor={Colors.Misty_Rose}
        barStyle="dark-content"
        animated={true}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-around',
          elevation: 5,
        }}>
        {loading && (
          <View styleName="stretch horizontal v-center h-center">
            <Image source={require('../assets/loader_small.gif')} />
            <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
              LOADING...
            </Caption>
          </View>
        )}

        {!loading && (
          <RentalPanel
            navigation={props.navigation}
            rentalRequest={rentalRequest}
          />
        )}
      </View>
    </Screen>
  );
};

RentalScreen.navigationOptions = () => ({
  headerRight: (
    <Button styleName="clear" onPress={() => {}}>
      <Icon name="history" />
    </Button>
  ),
});

export default RentalScreen;
