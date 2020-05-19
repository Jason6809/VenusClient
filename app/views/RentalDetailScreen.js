import React, {useState, useEffect} from 'react';
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

const SCREEN = 'RentalDetailScreen: ';

const RentalDetailScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const {
    rentalRequestUid,
    customer,
    stylist,
    stylistUid,
    itemUid,
    itemName,
    itemPic,
    itemTypeKey,
    itemTypeName,
    variant,
    rentalPeriod,
    status,
    isCompleted,
  } = props.navigation.state.params;

  var returnDatetime;
  if (props.navigation.state.params.returnDatetime) {
    returnDatetime = moment(
      props.navigation.state.params.returnDatetime.toDate(),
    );
  }

  const createdDatetime = moment(
    props.navigation.state.params.createdDatetime.toDate(),
  );

  const [confirmationInfo, setConfirmationInfo] = useState(null);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [isConfirmationVisible, toggleConfirmationVisible] = useState(false);
  const [isLoaderVisible, toggleLoaderVisible] = useState(false);

  async function getFcmToken() {
    const TAG = 'getFcmToken: ';
    console.log(SCREEN, TAG, 'start... ');

    const UserStatusRef = await DATABASE.collection('UserStatus')
      .doc(stylistUid)
      .get();
    console.log(SCREEN, TAG, 'UserStatusRef = ', UserStatusRef);

    var fcmToken = null;

    if (UserStatusRef.exists && UserStatusRef.data().fcmToken) {
      // statement
      fcmToken = UserStatusRef.data().fcmToken;
    }

    console.log(SCREEN, TAG, 'finish... ');
    return fcmToken;
  }

  async function cancelRentalRequest() {
    const TAG = 'cancelRentalRequest: ';
    console.log(SCREEN, TAG, 'start... ');

    toggleLoaderVisible(true);

    try {
      await AsyncStorage.setItem('isSelfAction', 'true');
    } catch (e) {
      console.error(SCREEN, TAG, 'AsyncStorage.setItem: error...', e);
    }

    DATABASE.collection('RentalRequest')
      .doc(rentalRequestUid)
      .delete()
      .then(async () => {
        console.log(SCREEN, TAG, 'finish... ');

        var title = 'Ouch !';
        var body = `${customer.profile.firstName} ${
          customer.profile.lastName
        } has cancel his Rental Request`;

        try {
          await sendNotification(title, body);
        } catch (e) {
          console.error(SCREEN, 'sendNotification: error....', e);
        }

        ToastAndroid.show('Reject Successful', ToastAndroid.LONG);

        toggleLoaderVisible(false);

        props.navigation.popToTop();

        console.log(SCREEN, TAG, 'finish... ');
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
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 15,
          }}>
          <View styleName="stretch lg-gutter-top">
            <Title styleName="md-gutter-bottom">Customer</Title>

            <Row style={{elevation: 3}}>
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
            </Row>
          </View>

          <View styleName="stretch lg-gutter-top">
            <Title styleName="md-gutter-bottom">Rental Item</Title>
            <Row style={{elevation: 3}}>
              <Image
                styleName="small rounded-corners"
                source={{
                  uri: itemPic,
                }}
              />
              <View styleName="vertical stretch v-center">
                <Subtitle>{itemName}</Subtitle>
                <View styleName="horizontal">
                  <Caption>{itemTypeName}</Caption>
                </View>
              </View>
              <Button
                styleName="right-icon"
                onPress={() => {
                  console.log(SCREEN, 'itemUid = ', itemUid);

                  props.navigation.navigate('RentalItemScreen', {
                    id: itemUid,
                    itemPic,
                    itemName,
                    itemTypeKey,
                    itemTypeName,
                    stylistUid,
                    isAllowedRenting: false,
                  });
                }}>
                <Icon name="right-arrow" />
              </Button>
            </Row>
          </View>

          <View styleName="stretch lg-gutter-top xl-gutter-bottom">
            <Title styleName="md-gutter-bottom">Details</Title>

            {!status && !isCompleted && (
              <View styleName="stretch md-gutter-bottom">
                <Divider styleName="section-header">
                  <Caption style={{color: Colors.Dark}}>CREATED ON</Caption>
                </Divider>

                <View styleName="stretch">
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {createdDatetime.format('dddd, MMMM D')}
                      </Caption>
                    </View>
                  </View>
                  <Divider styleName="line" />
                </View>
              </View>
            )}

            {status && !isCompleted && (
              <View styleName="stretch md-gutter-bottom">
                <Divider styleName="section-header">
                  <Caption style={{color: Colors.Dark}}>RETURN ON</Caption>
                </Divider>

                <View styleName="stretch">
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {returnDatetime.format('dddd, MMMM D')}
                      </Caption>
                    </View>
                  </View>
                  <Divider styleName="line" />
                </View>
              </View>
            )}

            <View styleName="stretch md-gutter-bottom">
              <Divider styleName="section-header">
                <Caption style={{color: Colors.Dark}}>RENTAL ITEM</Caption>
                <Caption style={{color: Colors.Dark}}>ITEM TYPE</Caption>
              </Divider>

              <View styleName="stretch">
                <Divider styleName="line" />
                <View styleName="md-gutter horizontal v-center space-between">
                  <View styleName="flexible">
                    <Caption style={{color: Colors.Dark}}>{itemName}</Caption>
                  </View>
                  <View styleName="flexible horizontal h-end">
                    <Caption>{itemTypeName}</Caption>
                  </View>
                </View>
                <Divider styleName="line" />
              </View>
            </View>

            <View styleName="stretch md-gutter-bottom">
              <Divider styleName="section-header">
                <Caption style={{color: Colors.Dark}}>ITEM VARIANT</Caption>
                <Caption style={{color: Colors.Dark}}>RENTAL PRICE</Caption>
              </Divider>

              <View styleName="stretch">
                <Divider styleName="line" />
                <View styleName="md-gutter horizontal v-center space-between">
                  <View styleName="flexible">
                    <Caption style={{color: Colors.Dark}}>
                      {variant.variantName}
                    </Caption>
                  </View>
                  <View styleName="flexible horizontal h-end">
                    <Caption style={{color: 'red'}}>
                      RM {variant.price.toFixed(2)} / day
                    </Caption>
                  </View>
                </View>
                <Divider styleName="line" />
              </View>
            </View>

            <View styleName="stretch md-gutter-bottom">
              <Divider styleName="section-header">
                <Caption style={{color: Colors.Dark}}>RENTAL PERIOD</Caption>
                <Caption style={{color: Colors.Dark}}>TOTAL AMOUNT</Caption>
              </Divider>

              <View styleName="stretch">
                <Divider styleName="line" />
                <View styleName="md-gutter horizontal v-center space-between">
                  <View styleName="flexible">
                    <Caption style={{color: 'red'}}>
                      {rentalPeriod} day(s)
                    </Caption>
                  </View>
                  <View styleName="flexible horizontal h-end">
                    <Caption style={{color: 'red'}}>
                      {'RM ' +
                        (variant.price.toFixed(2) * rentalPeriod).toFixed(2)}
                    </Caption>
                  </View>
                </View>
                <Divider styleName="line" />
              </View>
            </View>
          </View>

          {!status && (
            <View styleName="stretch md-gutter-bottom horizontal">
              <Button
                style={{elevation: 3}}
                styleName="full-width"
                onPress={() => {
                  setConfirmationInfo('Cancel Rental Request ?');
                  setConfirmationAction('cancel');
                  toggleConfirmationVisible(true);
                }}>
                <Icon name="clear-text" />
                <Text>Cancel</Text>
              </Button>
            </View>
          )}
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
        <View style={{backgroundColor: 'white', padding: 15}}>
          <View styleName="stretch">
            <Subtitle styleName="sm-gutter-bottom">CONFIRMATION</Subtitle>
          </View>
          <View styleName="stretch sm-gutter-top md-gutter-bottom">
            <Divider styleName="line" />
            <Text
              style={{color: 'red'}}
              styleName="h-center lg-gutter-top lg-gutter-bottom">
              {confirmationInfo}
            </Text>
            <Divider styleName="line" />
          </View>
          <View styleName="stretch horizontal">
            <Button
              style={{elevation: 3}}
              styleName="full-width"
              onPress={() => {
                toggleConfirmationVisible(false);
              }}>
              <Icon name="clear-text" />
              <Text>NO</Text>
            </Button>

            <Button
              style={{elevation: 3}}
              styleName="full-width secondary"
              onPress={() => {
                if (confirmationAction && confirmationAction === 'cancel') {
                  cancelRentalRequest();
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
        style={{margin: 96}}
        isVisible={isLoaderVisible}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}>
        <View style={{backgroundColor: 'white', padding: 15}}>
          <View styleName="horizontal h-center v-center">
            <ActivityIndicator size="large" color={Colors.Dark} />
            <Caption styleName="md-gutter-left">LOADING...</Caption>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

export default RentalDetailScreen;
