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

const SCREEN = 'ServicesScreen: ';

const ServicesScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const {
    serviceTypeKey,
    serviceTypeName,
    bookingDatetime,
  } = props.navigation.state.params;

  const [refreshing, setRefreshing] = useState(false);
  const [stylists, setStylists] = useState(null);
  const [serviceTypes, setServiceTypes] = useState(null);

  const [selectedServiceType, setSelectedServiceType] = useState({
    serviceTypeKey,
    serviceTypeName,
  });

  const [isTypesPickerVisible, toggleTypesPickerVisible] = useState(false);
  const [isPriceAscending, togglePriceAscending] = useState(true);

  useEffect(() => {
    async function getServiceTypes() {
      const TAG = 'getServiceTypes: ';

      const ServiceTypesRef = DATABASE.collection('ServiceTypes');

      try {
        var ServiceTypes = await ServiceTypesRef.orderBy(
          'serviceTypeKey',
        ).get();
        console.log(SCREEN, TAG, 'ServiceTypes = ', ServiceTypes);
      } catch (e) {
        // statements
        console.error(SCREEN, TAG, 'ServiceTypes:error...', e);
        return Promise.reject(e);
      }

      const items = [];
      for (const ServiceType of ServiceTypes.docs) {
        console.log(SCREEN, TAG, 'ServiceType = ', ServiceType);

        items.push({
          ...ServiceType.data(),
        });
      }

      console.log(SCREEN, TAG, 'items = ', items);

      setServiceTypes(items);

      console.log(SCREEN, TAG, 'finish... ');
    }

    getServiceTypes().catch(error => {
      console.log(SCREEN, 'getServiceTypes:error... ', error);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedServiceType]);

  async function fetchData() {
    const TAG = 'fetchData: ';
    console.log(SCREEN, TAG, 'start...');

    const currentUser = AUTH.currentUser;

    const items = [];

    const UserServicesRef = await DATABASE.collection('UserServices')
      .where(selectedServiceType.serviceTypeKey, '==', true)
      .get();
    console.log(SCREEN, TAG, 'UserServicesRef = ', UserServicesRef);

    if (!UserServicesRef.empty) {
      for (const UserService of UserServicesRef.docs) {
        console.log(SCREEN, TAG, 'userServices = ', UserService);

        const stylistUid = UserService.id;

        if (currentUser.uid !== stylistUid) {
          const UsersRef = await DATABASE.collection('Users')
            .doc(stylistUid)
            .get();
          console.log(SCREEN, TAG, 'UsersRef = ', UsersRef);

          const stylist = UsersRef.data();

          const ServiceItemsRef = await DATABASE.collection('UserServices')
            .doc(stylistUid)
            .collection(selectedServiceType.serviceTypeKey)
            .orderBy('price')
            .get();
          console.log(SCREEN, TAG, 'ServiceItemsRef = ', ServiceItemsRef);

          const serviceItems = ServiceItemsRef.docs;

          const length = ServiceItemsRef.size;
          const minPrice = ServiceItemsRef.docs[0].data().price;
          const maxPrice = ServiceItemsRef.docs[length - 1].data().price;

          items.push({
            stylistUid,
            stylist,
            serviceTypeKey: selectedServiceType.serviceTypeKey,
            serviceTypeName: selectedServiceType.serviceTypeName,
            serviceItems,
            minPrice,
            maxPrice,
            bookingDatetime,
            isAllowedBooking: true,
          });
        }
      }
    }

    console.log(SCREEN, TAG, 'items = ', items);

    setStylists(items);
    setRefreshing(false);

    console.log(SCREEN, TAG, 'finish...');
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
        <View
          style={{elevation: 3, backgroundColor: 'white'}}
          styleName="stretch">
          <View styleName="stretch">
            <Divider styleName="section-header">
              <Caption style={{color: Colors.Dark}}>
                {bookingDatetime.format('dddd, MMMM D')}
              </Caption>
            </Divider>
          </View>

          <Divider styleName="line" />
          <View styleName="horizontal stretch">
            <Button
              styleName="full-width clear"
              style={styles.button}
              onPress={() => {
                sorting(stylists);
              }}>
              <Icon name={!isPriceAscending ? 'up-arrow' : 'down-arrow'} />
              <Text>Price</Text>
            </Button>

            <Button
              styleName="full-width secondary"
              onPress={() => {
                toggleTypesPickerVisible(true);
              }}>
              <Text>{selectedServiceType.serviceTypeName}</Text>
              <Icon name="drop-down" />
            </Button>
          </View>
          <Divider styleName="line" />
        </View>

        <View styleName="flexible">
          {!stylists && (
            <View styleName="flexible stretch horizontal v-center h-center">
              <Image source={require('../assets/loader_small.gif')} />
              <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
                LOADING...
              </Caption>
            </View>
          )}

          {stylists && stylists.length <= 0 && (
            <View styleName="flexible stretch vertical v-center">
              <Caption styleName="horizontal h-center sm-gutter-top">
                SORRY... CAN'T FIND SUITABLE STYLIST FOR YOU...
              </Caption>
              <Button
                styleName="xl-gutter clear"
                onPress={() => {
                  setStylists(null);
                  refresh();
                }}>
                <Icon name="refresh" />
                <Text>Tap here to refresh</Text>
              </Button>
            </View>
          )}

          {stylists && stylists.length > 0 && (
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
              data={stylists}
              keyExtractor={item => item.stylistUid}
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
                      uri: item.stylist.profile.profilePic,
                    }}
                  />
                  <View styleName="content" style={{flex: 0}}>
                    <Subtitle
                      style={{
                        marginBottom: 0,
                        lineHeight: 20,
                      }}
                      styleName="h-center">
                      {`${item.stylist.profile.firstName} ${
                        item.stylist.profile.lastName
                      }`}
                    </Subtitle>
                    <Caption styleName="h-center">
                      {item.serviceTypeName}
                    </Caption>

                    <Divider styleName="line" />

                    <Subtitle
                      style={{
                        color: 'red',
                        marginTop: 10,
                        marginBottom: 0,
                        lineHeight: 15,
                      }}>
                      {`RM ${item.minPrice} ~ RM ${item.maxPrice}`}
                    </Subtitle>
                    <Caption>Min Price ~ Max Price</Caption>
                    <View styleName="horizontal v-center space-between">
                      <Caption>168 Stars</Caption>
                      <Button
                        styleName="tight clear"
                        onPress={() => {
                          props.navigation.navigate('StylistScreen', item);
                        }}>
                        <Icon name="add-event" />
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
            <Subtitle styleName="sm-gutter-bottom">SERVICE TYPES</Subtitle>
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
                  setSelectedServiceType(item);
                  setStylists(null);
                  // fetchData();
                  toggleTypesPickerVisible(false);
                }}>
                <Text>{item.serviceTypeName}</Text>
              </Button>
            )}
          />
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  titleView: {
    flex: 1,
  },
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    elevation: 0,
  },
});

export default ServicesScreen;
