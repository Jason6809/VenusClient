import React, {useState, useEffect} from 'react';
import {StyleSheet, FlatList} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from 'react-native-modal-datetime-picker';

import {
  View,
  Title,
  Subtitle,
  Text,
  Caption,
  Tile,
  Button,
  Icon,
  Divider,
} from '@shoutem/ui';

import moment from 'moment';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const COMPONENT = 'BookingFormTile: ';

const BookingFormTile = props => {
  console.log(COMPONENT, 'props = ', props);

  const minimumDate = new Date();
  const maximumDate = new Date().setMonth(minimumDate.getMonth() + 2);

  const [bookingDatetime, setBookingDatetime] = useState(
    moment()
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0),
  );

  const [serviceTypes, setServiceTypes] = useState(null);

  const [serviceTypeKey, setServiceTypeKey] = useState(null);
  const [serviceTypeName, setServiceTypeName] = useState(null);

  const [error, setError] = useState({
    hasError: false,
    errorMsg: '',
  });

  const [isDateTimePickerVisible, toggleDateTimePicker] = useState(false);
  const [isServicePickerVisible, toggleServicePickerVisible] = useState(false);

  useEffect(() => {
    async function getServiceTypes() {
      const TAG = 'getServiceTypes: ';

      const ServiceTypesRef = DATABASE.collection('ServiceTypes');

      try {
        var ServiceTypes = await ServiceTypesRef.orderBy(
          'serviceTypeKey',
        ).get();
        console.log(COMPONENT, TAG, 'ServiceTypes = ', ServiceTypes);
      } catch (e) {
        // statements
        console.error(COMPONENT, TAG, 'ServiceTypes:error...', e);
        return Promise.reject(e);
      }

      const items = [];
      for (const ServiceType of ServiceTypes.docs) {
        console.log(COMPONENT, TAG, 'ServiceType = ', ServiceType);

        items.push({
          ...ServiceType.data(),
        });
      }

      console.log(COMPONENT, TAG, 'items = ', items);

      setServiceTypes(items);

      console.log(COMPONENT, TAG, 'finish... ');
    }

    getServiceTypes().catch(error => {
      console.log(COMPONENT, 'getServiceTypes:error... ', error);
    });
  }, []);

  function updateBookingDatetime(date) {
    const TAG = 'updateBookingDatetime: ';

    const newDate = moment(date)
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0);

    console.log(COMPONENT, TAG, 'newDate = ', newDate.format());

    setBookingDatetime(newDate);
    toggleDateTimePicker(false);
  }

  return (
    <Tile style={styles.tile} styleName="md-gutter">
      <View styleName="stretch">
        <Title>STYLISTS FINDER</Title>
        <Caption style={styles.caption} styleName="sm-gutter-bottom">
          1233265 Stylists is Online
        </Caption>
        <Divider styleName="line" />
      </View>

      <View styleName="stretch sm-gutter-top md-gutter-bottom">
        <Caption>Choose a Date & Time:</Caption>
        <View styleName="horizontal stretch">
          <Button
            style={styles.button}
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
        <Caption>Choose a Place:</Caption>
        <View styleName="horizontal stretch">
          <Button
            style={styles.button}
            styleName="full-width"
            onPress={() => {}}>
            <Icon name="address" />
            <Text>Default Address</Text>
          </Button>
        </View>
      </View>

      <View styleName="stretch flexible sm-gutter-top md-gutter-bottom">
        <Caption>Choose a Service Type</Caption>
        <View styleName="horizontal stretch">
          <Button
            style={styles.button}
            styleName="full-width"
            onPress={() => {
              toggleServicePickerVisible(true);
            }}>
            <Icon name="restaurant-menu" />
            <Text>{serviceTypeName || 'Choose a Service Type'}</Text>
          </Button>
        </View>
        {error.hasError && (
          <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
        )}
      </View>

      <View styleName="horizontal stretch">
        <Button
          style={styles.button}
          styleName="full-width secondary"
          onPress={() => {
            if (serviceTypeKey) {
              props.navigation.navigate('ServicesScreen', {
                serviceTypeKey,
                serviceTypeName,
                bookingDatetime,
              });
            } else {
              setError({
                hasError: true,
                errorMsg: 'Please choose a Service Type.',
              });
            }
          }}>
          <Icon name="search" />
          <Text>Search Stylists</Text>
        </Button>
      </View>

      <Modal
        isVisible={isServicePickerVisible}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
        onBackdropPress={() => {
          toggleServicePickerVisible(false);
        }}
        onBackButtonPress={() => {
          toggleServicePickerVisible(false);
        }}>
        <View
          style={{
            backgroundColor: 'white',
            padding: 15,
          }}>
          <View styleName="stretch md-gutter-bottom">
            <Subtitle styleName="sm-gutter-bottom">SERVICE TYPE</Subtitle>
            <Divider styleName="line" />
          </View>

          <FlatList
            style={{flexGrow: 0}}
            data={serviceTypes}
            keyExtractor={item => item.serviceTypeKey}
            renderItem={({item}) => (
              <Button
                style={{elevation: 3}}
                styleName="secondary md-gutter-bottom"
                onPress={() => {
                  setServiceTypeKey(item.serviceTypeKey);
                  setServiceTypeName(item.serviceTypeName);

                  setError({
                    hasError: false,
                  });

                  toggleServicePickerVisible(false);
                }}>
                <Text>{item.serviceTypeName}</Text>
              </Button>
            )}
          />
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
          console.log(COMPONENT, 'DateTimePicker = ', date);
          updateBookingDatetime(date);
        }}
        onCancel={() => {
          toggleDateTimePicker(false);
        }}
      />
    </Tile>
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
  button: {
    elevation: 3,
  },
});

export default BookingFormTile;
