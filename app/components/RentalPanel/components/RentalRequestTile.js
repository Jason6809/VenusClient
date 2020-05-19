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

const COMPONENT = 'RentalRequestTile: ';

const RentalRequestTile = props => {
  console.log(COMPONENT, 'props = ', props);

  const {
    rentalRequestUid,
    itemUid,
    itemName,
    itemPic,
    itemTypeName,
    variant,
    rentalPeriod,
    stylistUid,
  } = props.rentalRequest;

  // const bookingDatetime = moment(props.rentalRequest.bookingDatetime.toDate());
  const createdDatetime = moment(props.rentalRequest.createdDatetime.toDate());

  return (
    <View styleName="flexible md-gutter">
      <Tile style={styles.tile} styleName="md-gutter">
        <View styleName="stretch">
          <Title>PENDING REQUEST</Title>
          <View styleName="horizontal h-end">
            <Caption>Created {createdDatetime.fromNow()}</Caption>
          </View>
          <Divider styleName="line" />
        </View>

        <View styleName="stretch sm-gutter-top md-gutter-bottom">
          <Caption>Rental Item:</Caption>
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
                console.log(COMPONENT, 'itemUid = ', itemUid);

                props.navigation.navigate('RentalItemScreen', {
                  id: itemUid,
                  ...props.rentalRequest,
                  isAllowedRenting: false,
                });
              }}>
              <Icon name="right-arrow" />
            </Button>
          </Row>
        </View>

        <View styleName="stretch flexible">
          <View styleName="stretch sm-gutter-bottom">
            <Caption>Created On:</Caption>
            <View styleName="stretch">
              <Divider styleName="line" />
              <View styleName="md-gutter horizontal space-between">
                <View styleName="flexible">
                  <Caption style={{color: Colors.Dark}}>
                    {createdDatetime.format('dddd, MMMM D')}
                  </Caption>
                </View>
                <View styleName="flexible horizontal h-end">
                  <Caption style={{color: 'red'}}>{}</Caption>
                </View>
              </View>
              <Divider styleName="line" />
            </View>
          </View>

          <View styleName="stretch sm-gutter-bottom">
            <Caption>Item and Variant:</Caption>
            <View styleName="stretch">
              <Divider styleName="line" />
              <View styleName="md-gutter horizontal v-center space-between">
                <View styleName="flexible">
                  <Caption style={{color: Colors.Dark}}>{itemName}</Caption>
                </View>

                <View styleName="flexible horizontal h-end">
                  <Caption style={{color: 'red'}}>
                    {variant.variantName}
                  </Caption>
                </View>
              </View>
              <Divider styleName="line" />
            </View>
          </View>

          <View styleName="stretch sm-gutter-bottom">
            <Caption>Price and Period:</Caption>
            <View styleName="stretch">
              <Divider styleName="line" />
              <View styleName="md-gutter horizontal v-center space-between">
                <View styleName="flexible">
                  <Caption style={{color: Colors.Dark}}>
                    RM {variant.price.toFixed(2)} / day
                  </Caption>
                </View>
                <View styleName="flexible horizontal h-end">
                  <Caption style={{color: 'red'}}>
                    Rent: {rentalPeriod} day(s)
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
              props.navigation.navigate('RentalDetailScreen', {
                rentalRequestUid,
                ...props.rentalRequest,
              });
            }}>
            <Text>View Details</Text>
            <Icon name="right-arrow" />
          </Button>
        </View>
      </Tile>
    </View>
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

export default RentalRequestTile;
