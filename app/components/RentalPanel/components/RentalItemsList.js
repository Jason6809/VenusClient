import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  SectionList,
  RefreshControl,
  FlatList,
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

import Colors from '../../../constants/Colors';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();

const COMPONENT = 'RentalItemsList: ';

const RentalItemsList = props => {
  console.log(COMPONENT, 'props = ', props);

  const [refreshing, setRefreshing] = useState(false);
  const [rentalItems, setRentalItems] = useState(null);

  useEffect(() => {
    fetchRentalItems().catch(error => {
      console.log(COMPONENT, 'fetchRentalItems: error... ', error);
    });
  }, []);

  async function fetchRentalItems() {
    const TAG = 'fetchRentalItems: ';
    console.log(COMPONENT, TAG, 'start... ');

    const items = [];

    const RentalItemTypesRef = DATABASE.collection('RentalItemTypes');
    try {
      var RentalItemTypes = await RentalItemTypesRef.get();
      console.log(COMPONENT, TAG, 'RentalItemTypes = ', RentalItemTypes);
    } catch (e) {
      console.error(COMPONENT, TAG, 'RentalItemTypes:error... ', e);
      return Promise.reject(e);
    }

    for (const RentalItemType of RentalItemTypes.docs) {
      const {itemTypeKey, itemTypeName} = RentalItemType.data();

      const title = {itemTypeKey, itemTypeName};
      const data = [];

      const RentalItemsRef = DATABASE.collection('RentalItems');

      try {
        var RentalItems = await RentalItemsRef.where(
          'itemTypeKey',
          '==',
          itemTypeKey,
        ).get();
        console.log(COMPONENT, TAG, 'RentalItems = ', RentalItems);
      } catch (e) {
        console.error(COMPONENT, TAG, 'RentalItems:error... ', e);
        return Promise.reject(e);
      }

      if (!RentalItems.empty) {
        const rentalItems = [];
        for (const RentalItem of RentalItems.docs) {
          const VariantsRef = RentalItemsRef.doc(RentalItem.id).collection(
            'Variants',
          );

          try {
            var Variants = await VariantsRef.orderBy('price').get();
            console.log(COMPONENT, TAG, 'Variants = ', Variants);
          } catch (e) {
            console.error(COMPONENT, 'Variants: error...', e);
            return Promise.reject(e);
          }

          if (!Variants.empty) {
            const length = Variants.size;
            const minPrice = Variants.docs[0].data().price;
            const maxPrice = Variants.docs[length - 1].data().price;

            rentalItems.push({
              id: RentalItem.id,
              minPrice,
              maxPrice,
              ...RentalItem.data(),
              isAllowedRenting: true,
            });
          }
        }

        if (rentalItems.length > 0) {
          // statement
          data.push({
            id: itemTypeKey,
            rentalItems,
          });
          console.log(COMPONENT, TAG, 'data = ', data);

          items.push({
            title,
            data,
          });
          console.log(COMPONENT, TAG, 'items = ', items);
        }
      }
    }

    console.log(COMPONENT, TAG, 'items = ', items);

    setRentalItems(items);
    setRefreshing(false);

    console.log(COMPONENT, TAG, 'finish... ');
  }

  async function refresh() {
    const TAG = 'refresh: ';
    console.log(COMPONENT, TAG, 'start...');

    setRefreshing(true);

    try {
      // statements
      await fetchRentalItems();
    } catch (e) {
      // statements
      console.error(COMPONENT, TAG, 'fetchProducts: error... ', e);
      return Promise.reject(e);
    }

    console.log(COMPONENT, TAG, 'finish...');
  }

  return (
    <View styleName="flexible stretch">
      {!rentalItems && (
        <View styleName="flexible stretch horizontal v-center h-center">
          <Image source={require('../../../assets/loader_small.gif')} />
          <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
            LOADING...
          </Caption>
        </View>
      )}

      {rentalItems && (
        <SectionList
          contentContainerStyle={{
            paddingBottom: 45,
          }}
          refreshControl={
            <RefreshControl
              //refresh control used for the Pull to Refresh
              refreshing={refreshing}
              onRefresh={() => {
                refresh();
              }}
            />
          }
          sections={rentalItems}
          keyExtractor={item => item.id}
          renderSectionHeader={({section: {title}}) => (
            <View styleName="horizontal v-center space-between lg-gutter-top md-gutter-bottom md-gutter-left md-gutter-right">
              <Title>{title.itemTypeName}</Title>

              <Button
                style={{elevation: 3}}
                styleName="secondary"
                onPress={() => {
                  props.navigation.navigate('RentalSearchScreen', {
                    ...title,
                  });
                }}>
                <Caption style={{color: 'white'}}>VIEW MORE</Caption>
                <Icon style={{margin: 0}} name="right-arrow" />
              </Button>
            </View>
          )}
          renderItem={({item}) => (
            <FlatList
              horizontal={true}
              data={item.rentalItems}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <Card
                  style={{
                    elevation: 3,
                    marginBottom: 5,
                    marginRight: 5,
                    marginLeft: 10,
                  }}>
                  <Image
                    style={{
                      width: '100%',
                      height: undefined,
                      aspectRatio: 1,
                      backgroundColor: '#f2f2f2',
                    }}
                    resizeMode="cover"
                    source={{
                      uri: item.itemPic,
                    }}
                  />
                  <View styleName="content" style={{flex: 0}}>
                    <Subtitle
                      style={{
                        marginBottom: 5,
                        lineHeight: 20,
                      }}
                      styleName="h-center">
                      {item.itemName}
                    </Subtitle>

                    <Divider styleName="line" />

                    <Subtitle
                      styleName="h-center"
                      style={{
                        color: 'red',
                        marginTop: 10,
                        marginBottom: 0,
                        lineHeight: 15,
                      }}>
                      {`RM ${item.minPrice} ~ RM ${item.maxPrice}`}
                    </Subtitle>

                    <Caption styleName="h-center sm-gutter-bottom">
                      Min Price ~ Max Price
                    </Caption>

                    <Divider styleName="line" />

                    <View styleName="sm-gutter-top horizontal h-end v-center">
                      <Button
                        styleName="tight clear"
                        onPress={() => {
                          props.navigation.navigate('RentalItemScreen', {
                            ...item,
                          });
                        }}>
                        <Caption style={{color: Colors.Dark}}>VIEW</Caption>
                        <Icon name="right-arrow" />
                      </Button>
                    </View>
                  </View>
                </Card>
              )}
            />
          )}
        />
      )}
    </View>
  );
};

export default RentalItemsList;
