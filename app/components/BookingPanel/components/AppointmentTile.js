import React from 'react';
import {StyleSheet} from 'react-native';

import {
  View,
  Title,
  Text,
  Caption,
  Tile,
  Row,
  Button,
  Subtitle,
  Icon,
  Divider,
  Image,
} from '@shoutem/ui';

import Colors from '../../../constants/Colors';

import moment from 'moment';

const COMPONENT = 'AppointmentTile: ';

const AppointmentTile = props => {
  console.log(COMPONENT, 'props = ', props);

  const {
    bookingRequestUid,
    stylist,
    serviceItem,
    serviceTypeKey,
    serviceTypeName,
    timeslot,
    stylistUid,
  } = props.bookingRequest;

  const bookingDatetime = moment(props.bookingRequest.bookingDatetime.toDate());
  // const createdDatetime = moment(props.bookingRequest.createdDatetime.toDate());

  return (
    <Tile style={styles.tile} styleName="md-gutter">
      <View styleName="stretch">
        <Title>UPCOMING APPOINTMENT</Title>
        <View styleName="horizontal h-end">
          <Caption style={{color: 'green'}}>
            Left {bookingDatetime.fromNow(true)}
          </Caption>
        </View>
        <Divider styleName="line" />
      </View>

      <View styleName="stretch sm-gutter-top md-gutter-bottom">
        <Caption>Stylist:</Caption>
        <Row style={{elevation: 3}}>
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
              console.log(COMPONENT, 'stylistUid = ', stylistUid);

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

      <View styleName="stretch flexible">
        <View styleName="stretch sm-gutter-bottom">
          <Caption>Booking On:</Caption>
          <View styleName="stretch">
            <Divider styleName="line" />
            <View styleName="md-gutter horizontal space-between">
              <View styleName="flexible">
                <Caption style={{color: Colors.Dark}}>
                  {bookingDatetime.format('dddd, MMMM D')}
                </Caption>
              </View>
              <View styleName="flexible horizontal h-end">
                <Caption style={{color: 'red'}}>
                  {moment(timeslot).format('hh:mm A')}
                </Caption>
              </View>
            </View>
            <Divider styleName="line" />
          </View>
        </View>

        <View styleName="stretch sm-gutter-bottom">
          <Caption>Location:</Caption>
          <View styleName="stretch">
            <Divider styleName="line" />
            <View styleName="md-gutter horizontal space-between">
              <View styleName="flexible horizontal h-center">
                <Caption style={{color: Colors.Dark}}>Some location...</Caption>
              </View>
            </View>
            <Divider styleName="line" />
          </View>
        </View>

        <View styleName="stretch sm-gutter-bottom">
          <Caption>Services:</Caption>
          <View styleName="stretch">
            <Divider styleName="line" />
            <View styleName="md-gutter horizontal v-center space-between">
              <View styleName="flexible">
                <Caption style={{color: Colors.Dark}}>
                  {serviceItem.serviceName}
                </Caption>
              </View>
              <View styleName="flexible horizontal h-center">
                <Caption>{serviceTypeName}</Caption>
              </View>
              <View styleName="flexible horizontal h-end">
                <Caption style={{color: 'red'}}>
                  RM {serviceItem.price.toFixed(2)}
                </Caption>
              </View>
            </View>
            <Divider styleName="line" />
          </View>
        </View>
      </View>

      <View styleName="stretch horizontal h-end v-center">
        <Button
          style={styles.button}
          styleName="secondary"
          onPress={() => {
            props.navigation.navigate('BookingDetailScreen', {
              bookingRequestUid,
              ...props.bookingRequest,
            });
          }}>
          <Text>View Details</Text>
          <Icon name="right-arrow" />
        </Button>
      </View>
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

export default AppointmentTile;
