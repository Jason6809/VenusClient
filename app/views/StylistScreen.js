import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  ToastAndroid,
} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from 'react-native-modal-datetime-picker';

import {
  Screen,
  View,
  NavigationBar,
  Title,
  Subtitle,
  Text,
  TextInput,
  Caption,
  Tile,
  Button,
  Icon,
  Row,
  TouchableOpacity,
  Card,
  Image,
  ImageBackground,
  Overlay,
  Lightbox,
  Divider,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import moment from 'moment';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const FUNCTIONS = firebase.functions();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'StylistScreen: ';

const StylistScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const minimumDate = new Date();
  const maximumDate = new Date().setMonth(minimumDate.getMonth() + 2);

  const {
    stylistUid,
    serviceTypeName,
    serviceTypeKey,
    stylist,
    isAllowedBooking,
  } = props.navigation.state.params;

  const stylistDatetime = moment(stylist.datetime.toDate());

  const [isLoaderVisible, toggleLoaderVisible] = useState(false);
  const [isDateTimePickerVisible, toggleDateTimePicker] = useState(false);
  const [isTimePickerVisible, toggleTimePickerVisible] = useState(false);

  const [bookingDatetime, setBookingDatetime] = useState(
    props.navigation.state.params.bookingDatetime,
  );

  const [serviceItems, setServiceItems] = useState(null);
  const [selectedServiceItem, setSelectedServiceItem] = useState(null);
  const [serviceTimeslots, setServiceTimeslots] = useState(null);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);

  const [error, setError] = useState({
    hasError: false,
    errorMsg: '',
  });

  useEffect(() => {
    async function getServiceItems() {
      const TAG = 'getServiceItems: ';

      const UserServiceRef = DATABASE.collection('UserServices').doc(
        stylistUid,
      );

      const ServiceTypeRef = UserServiceRef.collection(serviceTypeKey);

      try {
        var ServiceItems = await ServiceTypeRef.orderBy('price').get();
        console.log(SCREEN, TAG, 'ServiceItems = ', ServiceItems);
      } catch (e) {
        // statements
        console.error(SCREEN, 'ServiceItems: error...', e);
        return Promise.reject(e);
      }

      const items = [];
      for (const ServiceItem of ServiceItems.docs) {
        const PhotosRef = ServiceTypeRef.doc(ServiceItem.id).collection(
          'Photos',
        );

        try {
          var Photos = await PhotosRef.get();
          console.log(SCREEN, TAG, 'Photos = ', Photos);
        } catch (e) {
          // statements
          console.error(SCREEN, 'Photos: error...', e);
          return Promise.reject(e);
        }

        if (Photos.empty) {
          items.push({
            id: ServiceItem.id,
            ...ServiceItem.data(),
            photos: null,
          });
        } else {
          items.push({
            id: ServiceItem.id,
            ...ServiceItem.data(),
            photos: Photos.docs,
          });
        }
      }

      setServiceItems(items);
    }

    getServiceItems().catch(error => {
      console.error(SCREEN, 'getServiceItems: error...', error);
    });
  }, []);

  async function getTimeslots(serviceItemKey, bookingDatetime) {
    const TAG = 'getTimeslots: ';

    setServiceTimeslots(null);

    const UserServiceRef = DATABASE.collection('UserServices').doc(stylistUid);

    const ServiceTypeRef = UserServiceRef.collection(serviceTypeKey);

    const ServiceItemRef = ServiceTypeRef.doc(serviceItemKey);

    const TimeslotsRef = await ServiceItemRef.collection('Timeslots')
      .orderBy('hours')
      .get();

    const timeslots = [];

    for (const timeslot of TimeslotsRef.docs) {
      const datetime = new Date(bookingDatetime.format());
      console.log(SCREEN, TAG, 'datetime = ', datetime.toString());

      const BookingRequestRef = await DATABASE.collection('BookingRequest')
        .where('bookingDatetime', '==', datetime)
        .where('stylistUid', '==', stylistUid)
        .where('serviceTypeKey', '==', serviceTypeKey)
        .where('serviceItemKey', '==', serviceItemKey)
        .where('timeslotKey', '==', timeslot.id)
        .get();

      console.log(
        SCREEN,
        TAG,
        'BookingRequestRef.docs = ',
        BookingRequestRef.docs,
      );

      console.log(
        SCREEN,
        TAG,
        'BookingRequestRef.empty = ',
        BookingRequestRef.empty,
      );

      if (BookingRequestRef.empty) {
        timeslots.push({
          id: timeslot.id,
          timeslot: timeslot.data(),
        });
      }
    }

    console.log(SCREEN, TAG, 'timeslots = ', timeslots);

    return timeslots;
  }

  function updateBookingDatetime(date) {
    const TAG = 'updateBookingDatetime: ';
    console.log(SCREEN, TAG, 'start...');

    setServiceTimeslots(null);

    return new Promise(resolve => {
      const newDate = moment(date)
        .hours(0)
        .minutes(0)
        .seconds(0)
        .milliseconds(0);

      console.log(SCREEN, TAG, 'newDate = ', newDate.format());

      setBookingDatetime(newDate);
      toggleDateTimePicker(false);

      setTimeout(() => {
        return resolve(newDate);
      }, 1000);
    });
  }

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

  function createBookingRequest() {
    const TAG = 'createBookingRequest: ';
    console.log(SCREEN, TAG, 'start...');

    toggleLoaderVisible(true);

    const currentUser = AUTH.currentUser;

    const bookingRequest = {
      stylistUid: stylistUid,
      serviceTypeKey,
      serviceTypeName,
      serviceItemKey: selectedServiceItem.id,
      serviceItem: {
        serviceName: selectedServiceItem.serviceName,
        price: selectedServiceItem.price,
      },
      timeslotKey: selectedTimeslot.id,
      timeslot: selectedTimeslot.timeslot,
      bookingDatetime: new Date(bookingDatetime.format()),
      createdDatetime: new Date(),
      isCompleted: false,
      status: false,
    };

    console.log(SCREEN, TAG, 'bookingRequest = ', bookingRequest);

    DATABASE.collection('BookingRequest')
      .doc(currentUser.uid)
      .set(bookingRequest)
      .then(async result => {
        console.log(SCREEN, 'createBookingRequest: complete...');

        try {
          // statements
          var stylistFcmToken = await getFcmToken();
        } catch (e) {
          // statements
          console.error(SCREEN, 'getFcmToken: error...', e);
        }

        if (stylistFcmToken) {
          const sendMessage = FUNCTIONS.httpsCallable('sendMessage');

          try {
            await sendMessage({
              fcmToken: stylistFcmToken,
              title: 'Heads Up !',
              body: 'You have a new Booking Request',
            });
            console.log(SCREEN, 'sendMessage: success....');
          } catch (e) {
            // statements
            console.error(SCREEN, 'sendMessage: error....', e);
          }
        }

        ToastAndroid.show('Booking Successful', ToastAndroid.LONG);

        toggleLoaderVisible(false);

        props.navigation.popToTop();
      });
  }

  return (
    <Screen>
      <StatusBar
        backgroundColor="black"
        barStyle="light-content"
        animated={true}
      />

      <View style={{flex: 1, backgroundColor: 'white'}}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 45,
          }}>
          <ImageBackground
            style={{
              width: '100%',
              height: undefined,
              aspectRatio: 1,
            }}
            resizeMode="cover"
            source={{
              uri: stylist.profile.profilePic,
            }}>
            <Tile
              style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'flex-end',
                paddingBottom: 15,
                paddingLeft: 15,
                paddingRight: 15,
              }}>
              <Lightbox
                style={{elevation: 3, padding: 5, backgroundColor: '#f2f2f2'}}
                activeProps={{
                  style: {
                    flex: 1,
                    width: '100%',
                  },
                  resizeMode: 'contain',
                }}>
                <Image
                  style={{backgroundColor: '#f2f2f2'}}
                  styleName="medium-square"
                  source={{
                    uri: stylist.profile.profilePic,
                  }}
                />
              </Lightbox>
              <View styleName="content">
                <Overlay styleName="image-overlay">
                  <Subtitle
                    style={{color: 'white', elevation: 3}}
                    styleName="h-center">
                    {`${stylist.profile.firstName} ${stylist.profile.lastName}`}
                  </Subtitle>
                  <Caption style={{color: 'white', elevation: 3}}>
                    {stylist.email}
                  </Caption>
                </Overlay>
              </View>
            </Tile>
          </ImageBackground>

          <View styleName="stretch lg-gutter-top md-gutter-left md-gutter-right">
            <Title styleName="md-gutter-bottom">Profile</Title>
            <Divider styleName="section-header">
              <Caption style={{color: Colors.Dark}}>EXPERIENCE:</Caption>
              <Caption style={{color: Colors.Dark}}>STARS</Caption>
            </Divider>
            <View>
              <Divider styleName="line" />
              <View styleName="md-gutter horizontal space-between">
                <Caption style={{color: Colors.Dark}}>
                  {stylistDatetime.fromNow(true)}
                </Caption>
                <Caption style={{color: Colors.Dark}}>123456</Caption>
              </View>
              <Divider styleName="line" />
            </View>
          </View>

          <View styleName="stretch lg-gutter-top md-gutter-left md-gutter-right">
            <Title styleName="md-gutter-bottom">Services</Title>
            <Divider styleName="section-header">
              <Caption style={{color: Colors.Dark}}>SERVICE</Caption>
              <Caption style={{color: Colors.Dark}}>PRICE</Caption>
              <Caption style={{color: Colors.Dark}}>BOOK</Caption>
            </Divider>

            {!serviceItems && (
              <View>
                <Divider styleName="line" />
                <View styleName="md-gutter stretch horizontal h-center v-center">
                  <Image source={require('../assets/loader_small.gif')} />
                  <Caption
                    style={{color: Colors.Dark}}
                    styleName="md-gutter-left">
                    LOADING...
                  </Caption>
                </View>
                <Divider styleName="line" />
              </View>
            )}

            {serviceItems &&
              serviceItems.map(value => {
                return (
                  <View key={value.id}>
                    <Divider styleName="line" />
                    <View styleName="md-gutter horizontal v-center space-between">
                      <View styleName="flexible">
                        <Caption style={{color: Colors.Dark}}>
                          {value.serviceName}
                        </Caption>
                      </View>
                      <View styleName="flexible horizontal h-center">
                        <Caption style={{color: 'red'}}>
                          RM {value.price.toFixed(2)}
                        </Caption>
                      </View>
                      <View styleName="flexible horizontal h-end">
                        <Button
                          styleName={
                            isAllowedBooking ? 'tight clear' : 'tight muted'
                          }
                          onPress={() => {
                            console.log('serviceItemKey: ', value.id);

                            setSelectedServiceItem({
                              id: value.id,
                              serviceName: value.serviceName,
                              price: value.price,
                            });

                            getTimeslots(value.id, bookingDatetime)
                              .then(result => {
                                setServiceTimeslots(result);
                              })
                              .catch(error => {
                                console.error(
                                  SCREEN,
                                  'getTimeslots: error....',
                                  error,
                                );
                              });

                            toggleTimePickerVisible(true);
                          }}
                          disabled={!isAllowedBooking}>
                          <Icon name="add-event" />
                        </Button>
                      </View>
                    </View>

                    {!value.photos && (
                      <View
                        styleName="flexible stretch"
                        style={{
                          padding: 5,
                          height: 109,
                        }}>
                        <View styleName="flexible stretch vertical v-center h-center">
                          <Caption>SORRY... NO PHOTOS AVAILABLE YET...</Caption>
                        </View>
                      </View>
                    )}

                    {value.photos && (
                      <FlatList
                        horizontal={true}
                        contentContainerStyle={{
                          paddingBottom: 5,
                        }}
                        data={value.photos}
                        keyExtractor={item => item.id}
                        renderItem={({item}) => (
                          <Lightbox
                            style={{
                              marginTop: 1,
                              marginBottom: 10,
                              marginLeft: 5,
                              marginRight: 5,
                              padding: 5,
                              elevation: 3,
                              backgroundColor: '#f2f2f2',
                            }}
                            activeProps={{
                              style: {
                                flex: 1,
                                width: '100%',
                              },
                              resizeMode: 'contain',
                            }}>
                            <Image
                              styleName="medium"
                              source={{
                                uri: item.data().uri,
                              }}
                            />
                          </Lightbox>
                        )}
                      />
                    )}

                    <Divider styleName="line" />
                  </View>
                );
              })}
          </View>
        </ScrollView>
      </View>

      <Modal
        style={{margin: 0}}
        isVisible={isTimePickerVisible}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
        onBackdropPress={() => {
          toggleTimePickerVisible(false);
        }}
        onBackButtonPress={() => {
          toggleTimePickerVisible(false);
        }}>
        <NavigationBar
          style={{
            container: {elevation: 3, height: 56},
          }}
          styleName="inline"
          leftComponent={
            <Button
              styleName="sm-gutter-left"
              onPress={() => {
                toggleTimePickerVisible(false);
              }}>
              <Icon name="close" />
            </Button>
          }
          centerComponent={
            <View style={{width: 240}}>
              <Subtitle styleName="h-center">CONFIRM BOOKING</Subtitle>
            </View>
          }
        />

        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
          }}>
          <ScrollView
            contentContainerStyle={{
              padding: 15,
            }}>
            <View styleName="stretch sm-gutter-top md-gutter-bottom">
              <Caption>Confirm Date & Time:</Caption>
              <View styleName="horizontal stretch">
                <Button
                  style={{elevation: 3}}
                  styleName="full-width"
                  onPress={() => {
                    toggleDateTimePicker(true);
                  }}>
                  <Icon name="events" />
                  <Text>{bookingDatetime.format('dddd, MMMM D')}</Text>
                </Button>
              </View>
            </View>

            <View styleName="stretch sm-gutter-top md-gutter-bottom">
              <Caption>Confirm Place:</Caption>
              <View styleName="horizontal stretch">
                <Button
                  style={{elevation: 3}}
                  styleName="full-width"
                  onPress={() => {}}>
                  <Icon name="address" />
                  <Text>Default Address</Text>
                </Button>
              </View>
            </View>

            {selectedServiceItem && (
              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Confirm Service:</Caption>
                <Divider styleName="section-header">
                  <Caption style={{color: Colors.Dark}}>SERVICES</Caption>
                  <Caption style={{color: Colors.Dark}}>TYPE</Caption>
                  <Caption style={{color: Colors.Dark}}>PRICE</Caption>
                </Divider>
                <View>
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal v-center space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {selectedServiceItem.serviceName}
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-center">
                      <Caption>{serviceTypeName}</Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Caption style={{color: 'red'}}>
                        RM {selectedServiceItem.price.toFixed(2)}
                      </Caption>
                    </View>
                  </View>
                  <Divider styleName="line" />
                </View>
              </View>
            )}

            <View styleName="stretch vertical v-center sm-gutter-top sm-gutter-bottom">
              <Caption>Choose a Timeslot to Confirm Your Booking:</Caption>
              <Divider styleName="line" />
              {!serviceTimeslots && (
                <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                  <Image source={require('../assets/loader_small.gif')} />
                  <Caption
                    style={{color: Colors.Dark}}
                    styleName="md-gutter-left">
                    LOADING...
                  </Caption>
                </View>
              )}

              {serviceTimeslots && serviceTimeslots.length <= 0 && (
                <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                  <Caption style={{color: 'red'}}>
                    SORRY... FULLY BOOKED...
                  </Caption>
                </View>
              )}

              {serviceTimeslots && serviceTimeslots.length > 0 && (
                <FlatList
                  contentContainerStyle={{
                    paddingTop: 10,
                    paddingBottom: 15,
                  }}
                  horizontal={true}
                  data={serviceTimeslots}
                  keyExtractor={item => item.id}
                  renderItem={({item}) => (
                    <Button
                      style={{elevation: 3, marginTop: 5, marginBottom: 5}}
                      styleName={
                        selectedTimeslot && selectedTimeslot.id === item.id
                          ? 'sm-gutter'
                          : 'secondary sm-gutter'
                      }
                      onPress={() => {
                        setSelectedTimeslot(item);
                      }}>
                      {selectedTimeslot && selectedTimeslot.id === item.id ? (
                        <Icon name="rsvp" />
                      ) : null}
                      <Text>{moment(item.timeslot).format('hh:mm A')}</Text>
                    </Button>
                  )}
                />
              )}

              <Divider styleName="line" />

              {error.hasError && (
                <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
              )}
            </View>
          </ScrollView>

          <View styleName="stretch horizontal md-gutter-left md-gutter-right md-gutter-bottom">
            <Button
              styleName="full-width"
              style={{elevation: 3}}
              onPress={() => {
                toggleTimePickerVisible(false);
              }}>
              <Icon name="clear-text" />
              <Text>Cancel</Text>
            </Button>

            <Button
              styleName="full-width secondary"
              style={{elevation: 3}}
              onPress={() => {
                if (selectedTimeslot) {
                  createBookingRequest();
                } else {
                  setError({
                    hasError: true,
                    errorMsg: 'Please choose a timeslot to continue.',
                  });
                }
                toggleTimePickerVisible(false);
              }}>
              <Icon name="checkbox-on" />
              <Text>Confirm</Text>
            </Button>
          </View>
        </View>
      </Modal>

      <DateTimePicker
        date={new Date(bookingDatetime.format())}
        mode="date"
        is24Hour={false}
        datePickerModeAndroid="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        isVisible={isDateTimePickerVisible}
        onConfirm={date => {
          console.log(SCREEN, 'DateTimePicker = ', date);

          updateBookingDatetime(date).then(result => {
            console.log(SCREEN, 'updateBookingDatetime: complete...');

            const datetime = result;
            getTimeslots(selectedServiceItem.id, datetime).then(result => {
              setServiceTimeslots(result);
            });
          });
        }}
        onCancel={() => {
          toggleDateTimePicker(false);
        }}
      />

      <Modal
        style={{margin: 96}}
        isVisible={isLoaderVisible}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}>
        <View style={{backgroundColor: 'white', padding: 15}}>
          <View styleName="horizontal h-center v-center">
            <Image source={require('../assets/loader_small.gif')} />
            <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
              LOADING...
            </Caption>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

export default StylistScreen;
