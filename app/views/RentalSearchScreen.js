import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import Modal from 'react-native-modal';

import {
  Screen,
  View,
  Subtitle,
  Text,
  TextInput,
  Caption,
  Button,
  Icon,
  Card,
  Image,
  Divider,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'RentalSearchScreen: ';

const RentalSearchScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const {itemTypeKey, itemTypeName} = props.navigation.state.params;

  const [refreshing, setRefreshing] = useState(false);
  const [rentalItems, setRentalItems] = useState(null);
  const [rentalItemTypes, setRentalItemTypes] = useState(null);

  const [selectedRentalItemType, setSelectedRentalItemType] = useState({
    itemTypeKey,
    itemTypeName,
  });

  const [isTypesPickerVisible, toggleTypesPickerVisible] = useState(false);
  const [isPriceAscending, togglePriceAscending] = useState(true);

  useEffect(() => {
    async function getRentalItemTypes() {
      const TAG = 'getRentalItemTypes: ';

      const RentalItemTypesRef = DATABASE.collection('RentalItemTypes');

      try {
        var RentalItemTypes = await RentalItemTypesRef.orderBy(
          'itemTypeKey',
        ).get();
        console.log(SCREEN, TAG, 'RentalItemTypes = ', RentalItemTypes);
      } catch (e) {
        // statements
        console.error(SCREEN, TAG, 'RentalItemTypes:error...', e);
        return Promise.reject(e);
      }

      const items = [];
      for (const RentalItemType of RentalItemTypes.docs) {
        console.log(SCREEN, TAG, 'RentalItemType = ', RentalItemType);

        items.push({
          ...RentalItemType.data(),
        });
      }

      console.log(SCREEN, TAG, 'items = ', items);

      setRentalItemTypes(items);

      console.log(SCREEN, TAG, 'finish... ');
    }

    getRentalItemTypes().catch(error => {
      console.log(SCREEN, 'getRentalItemTypes:error... ', error);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedRentalItemType]);

  async function fetchData() {
    const TAG = 'fetchData: ';
    console.log(SCREEN, TAG, 'start... ');

    const RentalItemsRef = DATABASE.collection('RentalItems');

    try {
      var RentalItems;

      if (selectedRentalItemType.itemTypeKey) {
        RentalItems = await RentalItemsRef.where(
          'itemTypeKey',
          '==',
          selectedRentalItemType.itemTypeKey,
        ).get();
      } else {
        RentalItems = await RentalItemsRef.get();
      }

      console.log(SCREEN, TAG, 'RentalItems = ', RentalItems);
    } catch (e) {
      console.error(SCREEN, TAG, 'RentalItems:error... ', e);
      return Promise.reject(e);
    }

    const items = [];

    if (!RentalItems.empty) {
      for (const RentalItem of RentalItems.docs) {
        const VariantsRef = RentalItemsRef.doc(RentalItem.id).collection(
          'Variants',
        );

        try {
          var Variants = await VariantsRef.orderBy('price').get();
          console.log(SCREEN, TAG, 'Variants = ', Variants);
        } catch (e) {
          console.error(SCREEN, 'Variants: error...', e);
          return Promise.reject(e);
        }

        if (!Variants.empty) {
          const length = Variants.size;
          const minPrice = Variants.docs[0].data().price;
          const maxPrice = Variants.docs[length - 1].data().price;

          items.push({
            id: RentalItem.id,
            minPrice,
            maxPrice,
            ...RentalItem.data(),
            isAllowedRenting: true,
          });
        }
      }
    }

    console.log(SCREEN, TAG, 'items = ', items);

    setRentalItems(items);
    setRefreshing(false);

    console.log(SCREEN, TAG, 'finish... ');
  }

  async function refresh() {
    const TAG = 'refresh: ';
    console.log(SCREEN, TAG, 'start...');

    setRefreshing(true);
    try {
      // statements
      await fetchData();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'fetchData: error... ', e);
      return Promise.reject(e);
    }

    console.log(SCREEN, TAG, 'finish...');
  }

  async function sorting(array) {
    const TAG = 'sorting: ';
    console.log(SCREEN, TAG, 'start...');

    if (isPriceAscending) {
      array.sort((a, b) => {
        return a.minPrice - b.minPrice;
      });
      togglePriceAscending(!isPriceAscending);
    } else {
      array.sort((a, b) => {
        return b.minPrice - a.minPrice;
      });
      togglePriceAscending(!isPriceAscending);
    }

    console.log(SCREEN, TAG, 'array = ', array);

    console.log(SCREEN, TAG, 'finish...');
    return Promise.resolve(array);
  }

  return (
    <Screen>
      <StatusBar
        backgroundColor="white"
        barStyle="dark-content"
        animated={true}
      />
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <View style={{elevation: 3, backgroundColor: 'white'}}>
          <Divider styleName="line" />
          <View styleName="horizontal stretch">
            <Button
              styleName="full-width clear"
              onPress={() => {
                sorting(rentalItems);
              }}>
              <Icon name={!isPriceAscending ? 'up-arrow' : 'down-arrow'} />
              <Text>Price</Text>
            </Button>

            <Button
              styleName="full-width secondary"
              onPress={() => {
                toggleTypesPickerVisible(true);
              }}>
              <Text>{selectedRentalItemType.itemTypeName || 'All'}</Text>
              <Icon name="drop-down" />
            </Button>
          </View>
          <Divider styleName="line" />
        </View>

        <View styleName="flexible">
          {!rentalItems && (
            <View styleName="flexible stretch horizontal h-center v-center">
              <Image source={require('../assets/loader_small.gif')} />
              <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
                LOADING...
              </Caption>
            </View>
          )}

          {rentalItems && rentalItems.length <= 0 && (
            <View styleName="flexible stretch vertical v-center">
              <Caption styleName="horizontal h-center sm-gutter-top">
                SORRY... NO PRODUCTS AVAILABLE YET...
              </Caption>
              <Button
                styleName="xl-gutter clear"
                onPress={() => {
                  setRentalItems(null);
                  refresh();
                }}>
                <Icon name="refresh" />
                <Text>Tap here to refresh</Text>
              </Button>
            </View>
          )}

          {rentalItems && rentalItems.length > 0 && (
            <FlatList
              contentContainerStyle={{
                paddingLeft: 5,
                paddingRight: 5,
                paddingTop: 5,
                paddingBottom: 15,
              }}
              numColumns={2}
              refreshControl={
                <RefreshControl
                  //refresh control used for the Pull to Refresh
                  refreshing={refreshing}
                  onRefresh={() => {
                    refresh();
                  }}
                />
              }
              data={rentalItems}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <Card
                  style={{
                    elevation: 3,
                    marginBottom: 5,
                    marginRight: 5,
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
        </View>
      </View>

      <Modal
        isVisible={isTypesPickerVisible}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
        onBackdropPress={() => {
          toggleTypesPickerVisible(false);
        }}
        onBackButtonPress={() => {
          toggleTypesPickerVisible(false);
        }}>
        <View
          style={{
            backgroundColor: 'white',
            padding: 15,
          }}>
          <View styleName="stretch md-gutter-bottom">
            <Subtitle styleName="sm-gutter-bottom">RENTAL ITEM TYPES</Subtitle>
            <Divider styleName="line" />
          </View>

          <Button
            style={{elevation: 3}}
            styleName="secondary md-gutter-bottom"
            onPress={() => {
              setSelectedRentalItemType({
                itemTypeKey: null,
                itemTypeName: null,
              });
              setRentalItems(null);
              // fetchData();
              toggleTypesPickerVisible(false);
            }}>
            <Text>All</Text>
          </Button>

          <FlatList
            style={{flexGrow: 0}}
            data={rentalItemTypes}
            keyExtractor={item => item.itemTypeKey}
            renderItem={({item}) => (
              <Button
                style={{elevation: 3}}
                styleName="secondary md-gutter-bottom"
                onPress={() => {
                  setSelectedRentalItemType(item);
                  setRentalItems(null);
                  // fetchData();
                  toggleTypesPickerVisible(false);
                }}>
                <Text>{item.itemTypeName}</Text>
              </Button>
            )}
          />
        </View>
      </Modal>
    </Screen>
  );
};

export default RentalSearchScreen;
