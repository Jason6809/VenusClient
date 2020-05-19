import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  ScrollView,
  SectionList,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  ToastAndroid,
} from 'react-native';
import Modal from 'react-native-modal';

import {
  Screen,
  View,
  Title,
  Subtitle,
  Text,
  TextInput,
  Caption,
  Tile,
  Row,
  Card,
  Lightbox,
  Image,
  ImageBackground,
  Overlay,
  Divider,
  TouchableOpacity,
  Button,
  Icon,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const FUNCTIONS = firebase.functions();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'PurchaseOrdersScreen: ';

const PurchaseOrdersScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const [refreshing, setRefreshing] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState(null);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);

  const [confirmationInfo, setConfirmationInfo] = useState(null);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [isConfirmationVisible, toggleConfirmationVisible] = useState(false);
  const [isLoaderVisibile, toggleLoaderVisible] = useState(false);

  useEffect(() => {
    const currentUser = AUTH.currentUser;

    const PurchaseOrdersRef = DATABASE.collection('PurchaseOrders');
    const onPurchaseOrdersSnapshot = PurchaseOrdersRef.where(
      'customerUid',
      '==',
      currentUser.uid,
    )
      .where('isCompleted', '==', false)
      .onSnapshot(async querySnapshot => {
        console.log(SCREEN, 'querySnapshot = ', querySnapshot);
        const PurchaseOrders = querySnapshot;

        const items = [];

        for (const PurchaseOrder of PurchaseOrders.docs) {
          console.log(SCREEN, 'PurchaseOrder = ', PurchaseOrder);

          const {stylistUid} = PurchaseOrder.data();

          const UserRef = DATABASE.collection('Users');
          try {
            var stylist = await UserRef.doc(stylistUid).get();
            console.log(SCREEN, 'stylist = ', stylist);
          } catch (e) {
            // statements
            console.log(SCREEN, 'stylist: error', e);
          }

          PurchaseOrder.data().id = PurchaseOrder.id;

          items.push({
            stylist: {...stylist.data()},
            ...PurchaseOrder.data(),
          });
        }

        console.log(SCREEN, 'items = ', items);

        setPurchaseOrders(items);
        setRefreshing(false);

        console.log(SCREEN, 'finish... ');
      });

    return () => {
      const TAG = 'useEffect Cleanup: ';
      console.log(SCREEN, TAG, 'start...');

      if (onPurchaseOrdersSnapshot) {
        console.log(
          SCREEN,
          TAG,
          'onPurchaseOrdersSnapshot = ',
          onPurchaseOrdersSnapshot,
        );

        onPurchaseOrdersSnapshot();
      }
    };
  }, []);

  async function fetchPurchaseOrders() {
    const TAG = 'fetchPurchaseOrders: ';
    console.log(SCREEN, TAG, 'start... ');

    const currentUser = AUTH.currentUser;

    const PurchaseOrdersRef = DATABASE.collection('PurchaseOrders');

    PurchaseOrdersRef.where('customerUid', '==', currentUser.uid)
      .where('isCompleted', '==', false)
      .get()
      .then(async querySnapshot => {
        console.log(SCREEN, TAG, 'querySnapshot = ', querySnapshot);
        const PurchaseOrders = querySnapshot;

        const items = [];

        for (const PurchaseOrder of PurchaseOrders.docs) {
          console.log(SCREEN, TAG, 'PurchaseOrder = ', PurchaseOrder);

          const {stylistUid} = PurchaseOrder.data();

          const UserRef = DATABASE.collection('Users');
          try {
            var stylist = await UserRef.doc(stylistUid).get();
            console.log(SCREEN, TAG, 'stylist = ', stylist);
          } catch (e) {
            // statements
            console.log(SCREEN, TAG, 'stylist: error', e);
          }

          PurchaseOrder.data().id = PurchaseOrder.id;

          items.push({
            stylist: {...stylist.data()},
            ...PurchaseOrder.data(),
          });
        }

        console.log(SCREEN, TAG, 'items = ', items);

        setPurchaseOrders(items);
        setRefreshing(false);

        console.log(SCREEN, TAG, 'finish... ');
      });
  }

  async function refresh() {
    const TAG = 'refresh: ';
    console.log(SCREEN, TAG, 'start...');

    setRefreshing(true);
    try {
      // statements
      await fetchPurchaseOrders();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'fetchCart: error... ', e);
      return Promise.reject(e);
    }

    console.log(SCREEN, TAG, 'finish...');
  }

  async function getFcmToken() {
    const TAG = 'getFcmToken: ';

    const {stylistUid} = selectedPurchaseOrder;

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

  async function completePurchaseOrders() {
    const TAG = 'completePurchaseOrders: ';
    console.log(SCREEN, TAG, 'start... ');

    toggleLoaderVisible(true);

    const PurchaseOrder = selectedPurchaseOrder;
    PurchaseOrder.isCompleted = true;

    const PurchaseHistoryRef = DATABASE.collection('PurchaseHistory');
    PurchaseHistoryRef.add({
      ...PurchaseOrder,
      completedDatetime: new Date(),
      commissionRate: 20,
    }).then(doc => {
      console.log(SCREEN, TAG, 'doc = ', doc);

      const {id, stylist} = selectedPurchaseOrder;

      const PurchaseOrderRef = DATABASE.collection('PurchaseOrders');
      PurchaseOrderRef.doc(id)
        .delete()
        .then(async () => {
          console.log(SCREEN, TAG, 'finish... ');

          const title = 'Yeah !';
          const body = `${stylist.profile.firstName} ${
            stylist.profile.lastName
          } has completed his Purchase Order`;

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
      <StatusBar
        backgroundColor="white"
        barStyle="dark-content"
        animated={true}
      />

      <View style={{flex: 1, backgroundColor: 'white'}}>
        {!purchaseOrders && (
          <View styleName="flexible stretch horizontal v-center h-center">
            <Image source={require('../assets/loader_small.gif')} />
            <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
              LOADING...
            </Caption>
          </View>
        )}

        {purchaseOrders && (
          <FlatList
            contentContainerStyle={{
              paddingTop: 5,
              paddingBottom: 45,
              paddingHorizontal: 5,
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
            data={purchaseOrders}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <Row
                style={{
                  elevation: 3,
                  marginBottom: 5,
                  padding: 10,
                }}>
                <View
                  style={{
                    flex: 0,
                    alignSelf: 'flex-start',
                    marginRight: 10,
                  }}>
                  <Image
                    styleName="medium-square rounded-corners"
                    source={{
                      uri: item.productPic,
                    }}
                  />
                </View>
                <View styleName="vertical stretch space-between">
                  <Subtitle>{item.productName}</Subtitle>
                  <Caption style={{color: Colors.Dark}}>
                    {item.variant.variantName}
                  </Caption>
                  <View styleName="horizontal space-between">
                    <View>
                      <Text style={{color: 'red'}}>
                        {'RM ' +
                          (
                            item.variant.price.toFixed(2) *
                            item.purchaseQuantity
                          ).toFixed(2)}
                      </Text>
                      <Caption>
                        RM {item.variant.price.toFixed(2)} / pcs
                      </Caption>
                    </View>
                    <Caption style={{color: Colors.Dark, paddingHorizontal: 5}}>
                      {item.purchaseQuantity} PCS
                    </Caption>
                  </View>
                  {item.status && (
                    <Caption
                      styleName="horizontal h-end"
                      style={{color: 'orange'}}>
                      &#9432; Item is delivering...
                    </Caption>
                  )}

                  {!item.status && (
                    <Caption style={{color: 'gold'}}>
                      &#9432; Pending to be sent...
                    </Caption>
                  )}
                  <View styleName="horizontal v-center space-between">
                    {item.status && (
                      <Button
                        style={{paddingHorizontal: 5}}
                        styleName="secondary"
                        onPress={() => {
                          setSelectedPurchaseOrder(item);
                          setConfirmationInfo('Complete Purchase Order ?');
                          setConfirmationAction('complete');
                          toggleConfirmationVisible(true);
                        }}>
                        <Caption style={{color: 'white'}}>
                          COMPLETE ORDER
                        </Caption>
                      </Button>
                    )}
                    <Button
                      styleName="clear"
                      onPress={() => {
                        props.navigation.navigate('ProductItemScreen', {
                          id: item.productUid,
                          productPic: item.productPic,
                          productName: item.productName,
                          productTypeKey: item.productTypeKey,
                          productTypeName: item.productTypeName,
                          stylistUid: item.stylistUid,
                        });
                      }}>
                      <Caption style={{color: Colors.Dark}}>VIEW</Caption>
                    </Button>
                  </View>
                </View>
              </Row>
            )}
          />
        )}
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
                if (confirmationAction && confirmationAction === 'complete') {
                  completePurchaseOrders();
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
        isVisible={isLoaderVisibile}
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

export default PurchaseOrdersScreen;
