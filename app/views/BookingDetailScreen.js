import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
  AsyncStorage,
} from 'react-native';
import Modal from 'react-native-modal';

import {
  Screen,
  View,
  Title,
  Text,
  Caption,
  Tile,
  Row,
  Button,
  TouchableOpacity,
  Subtitle,
  Icon,
  Divider,
  Image,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import moment from 'moment';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const FUNCTIONS = firebase.functions();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'BookingDetailScreen: ';

const BookingDetailScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const {
    bookingRequestUid,
    customer,
    stylistUid,
    stylist,
    serviceItem,
    serviceTypeKey,
    serviceTypeName,
    timeslot,
    status,
    isCompleted,
  } = props.navigation.state.params;

  const bookingDatetime = moment(
    props.navigation.state.params.bookingDatetime.toDate(),
  );
  const createdDatetime = moment(
    props.navigation.state.params.createdDatetime.toDate(),
  );

  const [confirmationInfo, setConfirmationInfo] = useState(null);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [isConfirmationVisible, toggleConfirmationVisible] = useState(false);
  const [isLoaderVisibile, toggleLoaderVisible] = useState(false);

  async function getFcmToken() {
    const TAG = 'getFcmToken: ';
    const UserStatusRef = await DATABASE.collection('UserStatus')
      .doc(stylistUid)
      .get();
    console.log(SCREEN, TAG, 'UserStatusRef = ', UserStatusRef);

    var fcmToken = null;

    if (UserStatusRef.exists && UserStatusRef.data().fcmToken) {
      // statement
      fcmToken = UserStatusRef.data().fcmToken;
    }

    return fcmToken;
  }

  async function completeAppointment() {
    const TAG = 'completeAppointment: ';
    console.log(SCREEN, TAG, 'start... ');

    toggleLoaderVisible(true);

    try {
      await AsyncStorage.setItem('isCancelledBySelf', 'true');
    } catch (e) {
      console.error(SCREEN, TAG, 'AsyncStorage.setItem: error...', e);
    }

    const BookingRequest = props.navigation.state.params;
    BookingRequest.isCompleted = true;

    const AppointmentHistoryRef = DATABASE.collection('AppointmentHistory');
    AppointmentHistoryRef.add({
      ...BookingRequest,
      completedDatetime: new Date(),
      commissionRate: 20,
    }).then(doc => {
      console.log(SCREEN, TAG, 'doc = ', doc);

      const BookingRequestRef = DATABASE.collection('BookingRequest');
      BookingRequestRef.doc(bookingRequestUid)
        .delete()
        .then(async () => {
          console.log(SCREEN, TAG, 'finish... ');

          const title = 'Yeah !';
          const body = `${customer.profile.firstName} ${
            customer.profile.lastName
            } has completed his Appointment`;

          try {
            await sendNotification(title, body);
          } catch (e) {
            console.error(SCREEN, TAG, 'sendNotification: error....', e);
          }

          ToastAndroid.show('Complete Successful', ToastAndroid.LONG);

          toggleLoaderVisible(false);

          props.navigation.popToTop();
        });
    });
  }

  async function cancelBookingRequest() {
    const TAG = 'cancelBookingRequest: ';
    console.log(SCREEN, TAG, 'start... ');

    toggleLoaderVisible(true);

    try {
      await AsyncStorage.setItem('isCancelledBySelf', 'true');
    } catch (e) {
      console.error(SCREEN, TAG, 'AsyncStorage.setItem: error...', e);
    }

    DATABASE.collection('BookingRequest')
      .doc(bookingRequestUid)
      .delete()
      .then(async () => {
        console.log(SCREEN, TAG, 'finish... ');

        const title = 'Ouch !';
        const body = `${customer.profile.firstName} ${
          customer.profile.lastName
          } has cancelled his Booking Request`;

        try {
          await sendNotification(title, body);
        } catch (e) {
          console.error(SCREEN, TAG, 'sendNotification: error....', e);
        }

        ToastAndroid.show('Cancel Successful', ToastAndroid.LONG);

        toggleLoaderVisible(false);

        props.navigation.popToTop();
      });
  }

  async function sendNotification(title, body) {
    const TAG = 'sendNotification: ';
    console.log(SCREEN, TAG, 'start... ');

    try {
      var stylistFcmToken = await getFcmToken();
    } catch (e) {
      console.error(SCREEN, TAG, 'getFcmToken: error....', e);
    }

    if (stylistFcmToken) {
      const sendMessage = FUNCTIONS.httpsCallable('sendMessage');

      try {
        await sendMessage({
          fcmToken: stylistFcmToken,
          title,
          body,
        });
        console.log(SCREEN, TAG, 'sendMessage: success....');
      } catch (e) {
        // statements
        console.error(SCREEN, TAG, 'sendMessage: error....', e);
      }
    }

    console.log(SCREEN, TAG, 'finish... ');
  }

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 15,
          }}>
          <View styleName="stretch lg-gutter-top">
            <Title styleName="md-gutter-bottom">Customer</Title>
            <Row style={{ elevation: 3 }}>
              <Image
                styleName="small rounded-corners"
                source={{
                  uri: customer.profile.profilePic,
                }}
              />
              <View styleName="vertical stretch v-center">
                <Subtitle>{`${customer.profile.firstName} ${
                  customer.profile.lastName
                  }`}</Subtitle>
                <View styleName="horizontal">
                  <Caption>{`${customer.email}`}</Caption>
                </View>
              </View>
              <Button styleName="right-icon" onPress={() => {}}>
                <Icon name="right-arrow" />
              </Button>
            </Row>
          </View>

          <View styleName="stretch lg-gutter-top ">
            <Title styleName="md-gutter-bottom">Stylist</Title>

            <Row style={{ elevation: 3 }}>
              <Image
                styleName="small rounded-corners"
                source={{
                  uri: stylist.profile.profilePic,
                }}
              />
              <View styleName="vertical stretch v-center">
                <Subtitle>{`${stylist.profile.firstName} ${
                  stylist.profile.lastName
                  }`}</Subtitle>
                <View styleName="horizontal">
                  <Caption>{`${stylist.email}`}</Caption>
                </View>
              </View>
              <Button
                styleName="right-icon"
                onPress={() => {
                  console.log(SCREEN, 'stylistUid = ', stylistUid);

                  props.navigation.navigate('StylistScreen', {
                    stylistUid,
                    serviceTypeKey,
                    serviceTypeName,
                    stylist,
                    bookingDatetime,
                    isAllowedBooking: false,
                  });
                }}>
                <Icon name="right-arrow" />
              </Button>
            </Row>
          </View>

          <View styleName="stretch lg-gutter-top xl-gutter-bottom">
            <Title styleName="md-gutter-bottom">Details</Title>

            <View styleName="stretch md-gutter-bottom">
              <Divider styleName="section-header">
                <Caption style={{ color: Colors.Dark }}>CREATED ON</Caption>
              </Divider>

              <View styleName="stretch">
                <Divider styleName="line" />
                <View styleName="md-gutter horizontal space-between">
                  <View styleName="flexible">
                    <Caption style={{ color: Colors.Dark }}>
                      {createdDatetime.format('dddd, MMMM D')}
                    </Caption>
                  </View>
                </View>
                <Divider styleName="line" />
              </View>
            </View>

            <View styleName="stretch md-gutter-bottom">
              <Divider styleName="section-header">
                <Caption style={{ color: Colors.Dark }}>BOOKING ON</Caption>
              </Divider>

              <View styleName="stretch">
                <Divider styleName="line" />
                <View styleName="md-gutter horizontal space-between">
                  <View styleName="flexible">
                    <Caption style={{ color: Colors.Dark }}>
                      {bookingDatetime.format('dddd, MMMM D')}
                    </Caption>
                  </View>
                  <View styleName="flexible horizontal h-end">
                    <Caption style={{ color: 'red' }}>
                      {moment(timeslot).format('hh:mm A')}
                    </Caption>
                  </View>
                </View>
                <Divider styleName="line" />
              </View>
            </View>

            <View styleName="stretch md-gutter-bottom">
              <Divider styleName="section-header">
                <Caption style={{ color: Colors.Dark }}>LOCATION</Caption>
              </Divider>
              <View styleName="stretch">
                <Divider styleName="line" />
                <View styleName="md-gutter horizontal space-between">
                  <View styleName="flexible horizontal h-center">
                    <Caption style={{ color: Colors.Dark }}>
                      Some location...
                    </Caption>
                  </View>
                </View>
                <Divider styleName="line" />
              </View>
            </View>

            <View styleName="stretch md-gutter-bottom">
              <Divider styleName="section-header">
                <Caption style={{ color: Colors.Dark }}>SERVICES</Caption>
              </Divider>
              <View styleName="stretch">
                <Divider styleName="line" />
                <View styleName="md-gutter horizontal space-between">
                  <View styleName="flexible">
                    <Caption style={{ color: Colors.Dark }}>
                      {serviceItem.serviceName}
                    </Caption>
                  </View>
                  <View styleName="flexible horizontal h-center">
                    <Caption>{serviceTypeName}</Caption>
                  </View>
                  <View styleName="flexible horizontal h-end">
                    <Caption style={{ color: 'red' }}>
                      RM {serviceItem.price.toFixed(2)}
                    </Caption>
                  </View>
                </View>
                <Divider styleName="line" />
              </View>
            </View>
          </View>

          <View styleName="stretch md-gutter-bottom horizontal">
            {!status && (
              <Button
                style={{ elevation: 3 }}
                styleName="full-width"
                onPress={() => {
                  if (status) {
                    setConfirmationInfo('Cancel Appointment ?');
                  } else {
                    setConfirmationInfo('Cancel Booking Request ?');
                  }
                  setConfirmationAction('cancel');
                  toggleConfirmationVisible(true);
                }}>
                <Icon name="clear-text" />
                <Text>Cancel</Text>
              </Button>
            )}

            {status && !isCompleted && (
              <Button
                style={{ elevation: 3 }}
                styleName="full-width secondary"
                onPress={() => {
                  setConfirmationInfo('Complete Appointment ?');
                  setConfirmationAction('complete');
                  toggleConfirmationVisible(true);
                }}>
                <Icon name="checkbox-on" />
                <Text>Complete</Text>
              </Button>
            )}
          </View>
        </ScrollView>
      </View>

      <Modal
        isVisible={isConfirmationVisible}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
        onBackdropPress={() => {
          toggleConfirmationVisible(false);
        }}
        onBackButtonPress={() => {
          toggleConfirmationVisible(false);
        }}>
        <View style={{ backgroundColor: 'white', padding: 15 }}>
          <View styleName="stretch">
            <Subtitle styleName="sm-gutter-bottom">CONFIRMATION</Subtitle>
          </View>
          <View styleName="stretch sm-gutter-top md-gutter-bottom">
            <Divider styleName="line" />
            <Text
              style={{ color: 'red' }}
              styleName="h-center lg-gutter-top lg-gutter-bottom">
              {confirmationInfo}
            </Text>
            <Divider styleName="line" />
          </View>
          <View styleName="stretch horizontal">
            <Button
              style={{ elevation: 3 }}
              styleName="full-width"
              onPress={() => {
                toggleConfirmationVisible(false);
              }}>
              <Icon name="clear-text" />
              <Text>NO</Text>
            </Button>

            <Button
              style={{ elevation: 3 }}
              styleName="full-width secondary"
              onPress={() => {
                if (confirmationAction && confirmationAction === 'complete') {
                  completeAppointment();
                } else if (
                  confirmationAction &&
                  confirmationAction === 'cancel'
                ) {
                  cancelBookingRequest();
                }
                toggleConfirmationVisible(false);
              }}>
              <Icon name="checkbox-on" />
              <Text>YES</Text>
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        style={{ margin: 96 }}
        isVisible={isLoaderVisibile}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}>
        <View style={{ backgroundColor: 'white', padding: 15 }}>
          <View styleName="horizontal h-center v-center">
            <Image source={require('../assets/loader_small.gif')} />
            <Caption style={{ color: Colors.Dark }} styleName="md-gutter-left">
              LOADING...
            </Caption>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    elevation: 5,
  },
  caption: {
    textAlign: 'right',
  },
  touchableOpacity: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    elevation: 3,
  },
});

export default BookingDetailScreen;
