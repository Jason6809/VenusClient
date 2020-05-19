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
import {TextInputMask} from 'react-native-masked-text';

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

const SCREEN = 'CartScreen: ';

const CartScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const [refreshing, setRefreshing] = useState(false);
  const [cartProducts, setCartProducts] = useState(null);
  const [validCartProducts, setValidCartProducts] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedCartProduct, setSelectedCartProduct] = useState(null);
  const [isLoaderVisible, toggleLoaderVisible] = useState(false);
  const [isConfirmationVisible, toggleConfirmationVisible] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationInfo, setConfirmationInfo] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    const TAG = 'fetchCart: ';
    console.log(SCREEN, TAG, 'start... ');

    const currentUser = AUTH.currentUser;

    const CartRef = DATABASE.collection('Cart').doc(currentUser.uid);
    const onCartProductsSnapshot = CartRef.collection('CartProducts')
      .orderBy('productUid')
      .onSnapshot(async querySnapshot => {
        console.log(SCREEN, TAG, 'querySnapshot = ', querySnapshot);
        const CartProducts = querySnapshot;

        var totalAmt = 0;
        const allItems = [];
        const validItems = [];

        for (const CartProduct of CartProducts.docs) {
          const {
            customerUid,
            stylistUid,
            productUid,
            purchaseQuantity,
            variantKey,
          } = CartProduct.data();

          const ProductRef = DATABASE.collection('Products').doc(productUid);
          try {
            var Product = await ProductRef.get();
            console.log(SCREEN, TAG, 'Product = ', Product);
          } catch (e) {
            // statements
            console.error(SCREEN, TAG, 'Product:error... ', e);
            return Promise.reject(e);
          }

          if (Product.exists) {
            const VariantRef = DATABASE.collection('Products')
              .doc(productUid)
              .collection('Variants')
              .doc(variantKey);

            try {
              var Variant = await VariantRef.get();
              console.log(SCREEN, TAG, 'Variant = ', Variant);
            } catch (e) {
              // statements
              console.error(SCREEN, TAG, 'Variant:error... ', e);
              return Promise.reject(e);
            }

            if (purchaseQuantity <= Variant.data().quantity) {
              totalAmt =
                totalAmt + Variant.data().price.toFixed(2) * purchaseQuantity;

              if (Variant.exists) {
                validItems.push({
                  customerUid,
                  id: CartProduct.id,
                  stylistUid,
                  productUid,
                  purchaseQuantity,
                  variantKey,
                  ...Product.data(),
                  variant: {
                    ...Variant.data(),
                  },
                });
                console.log(SCREEN, TAG, 'validItems = ', validItems);
              }
            }

            if (Variant.exists) {
              allItems.push({
                customerUid,
                id: CartProduct.id,
                stylistUid,
                productUid,
                purchaseQuantity,
                variantKey,
                ...Product.data(),
                variant: {
                  ...Variant.data(),
                },
              });
              console.log(SCREEN, TAG, 'allItems = ', allItems);
            }
          }
        }

        console.log(SCREEN, TAG, 'validItems = ', validItems);
        setValidCartProducts(validItems);

        console.log(SCREEN, TAG, 'allItems = ', allItems);
        setCartProducts(allItems);

        setTotalAmount(totalAmt);
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
      await fetchCart();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'fetchCart: error... ', e);
      return Promise.reject(e);
    }

    console.log(SCREEN, TAG, 'finish...');
  }

  async function checkout() {
    const TAG = 'checkout: ';
    console.log(SCREEN, TAG, 'start... ');

    if (!validCartProducts || validCartProducts.length <= 0) {
      const error = 'validCartProducts is null';
      console.error(SCREEN, TAG, 'error', error);
      return Promise.reject(error);
    }

    toggleLoaderVisible(true);

    const currentUser = AUTH.currentUser;

    for (const validCartProduct of validCartProducts) {
      console.log(SCREEN, TAG, 'cartProduct = ', validCartProduct);

      const {id, productUid, variantKey, purchaseQuantity} = validCartProduct;

      const PurchaseOrders = DATABASE.collection('PurchaseOrders');
      try {
        await PurchaseOrders.add({
          createdDatetime: new Date(),
          status: false,
          isCompleted: false,
          ...validCartProduct,
        });
      } catch (e) {
        // statements
        console.error(SCREEN, TAG, 'add:error... ', e);
        return Promise.reject(e);
      }

      const ProductRef = DATABASE.collection('Products').doc(productUid);
      const VariantRef = ProductRef.collection('Variants').doc(variantKey);
      try {
        await VariantRef.update({
          quantity: firebase.firestore.FieldValue.increment(
            -Math.abs(purchaseQuantity),
          ),
        });
      } catch (e) {
        // statements
        console.error(SCREEN, TAG, 'update:error... ', e);
        return Promise.reject(e);
      }

      const CartRef = DATABASE.collection('Cart').doc(currentUser.uid);
      const CartProductRef = CartRef.collection('CartProducts').doc(id);
      try {
        await CartProductRef.delete();
      } catch (e) {
        // statements
        console.error(SCREEN, TAG, 'delete:error... ', e);
        return Promise.reject(e);
      }
    }

    // fetchCart();

    console.log(SCREEN, TAG, 'finish... ');

    ToastAndroid.show('Checkout Successful', ToastAndroid.LONG);

    toggleLoaderVisible(false);
  }

  async function deleteCartProduct() {
    const TAG = 'deleteProduct: ';
    console.log(SCREEN, TAG, 'start... ');

    toggleLoaderVisible(true);

    const currentUser = AUTH.currentUser;

    const CartRef = DATABASE.collection('Cart').doc(currentUser.uid);
    const CartProductRef = CartRef.collection('CartProducts').doc(
      selectedCartProduct.id,
    );

    try {
      await CartProductRef.delete();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    ToastAndroid.show('Delete Successful', ToastAndroid.LONG);

    toggleLoaderVisible(false);
  }

  return (
    <Screen style={{backgroundColor: Colors.Misty_Rose}}>
      <StatusBar
        backgroundColor={Colors.Misty_Rose}
        barStyle="dark-content"
        animated={true}
      />

      <View style={{flex: 1}}>
        {!cartProducts && (
          <View styleName="flexible stretch horizontal v-center h-center">
            <Image source={require('../assets/loader_small.gif')} />
            <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
              LOADING...
            </Caption>
          </View>
        )}

        {cartProducts && cartProducts.length <= 0 && (
          <View styleName="md-gutter flexible stretch vertical v-center">
            <Caption
              style={{color: Colors.Dark}}
              styleName="horizontal h-center sm-gutter-top">
              YOU CART IS EMPTY... YOU CAN EITHER REFRESH OR ADD SOMETHING TO
              YOUR CART...
            </Caption>
            <Button
              styleName="xl-gutter clear"
              onPress={() => {
                setCartProducts(null);
                refresh();
              }}>
              <Icon name="refresh" />
              <Text>Tap here to refresh</Text>
            </Button>
          </View>
        )}

        {cartProducts && cartProducts.length > 0 && (
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
            data={cartProducts}
            keyExtractor={item => item.id}
            renderItem={({item}) => {
              if (item.purchaseQuantity > item.variant.quantity) {
                return (
                  <Row
                    style={{
                      elevation: 3,
                      marginBottom: 5,
                      paddingTop: 10,
                      paddingHorizontal: 10,
                      paddingBottom: 7,
                      borderBottomColor: 'red',
                      borderBottomWidth: 3,
                    }}>
                    <Image
                      style={{
                        backgroundColor: '#f2f2f2',
                        marginRight: 10,
                      }}
                      styleName="medium-square rounded-corners top"
                      source={{
                        uri: item.productPic,
                      }}
                    />
                    <View styleName="vertical stretch space-between">
                      <Subtitle>{item.productName}</Subtitle>
                      <Caption style={{color: Colors.Dark}}>
                        {item.variant.variantName}
                      </Caption>
                      <View>
                        <Text
                          style={{
                            color: 'red',
                          }}>
                          {`RM ${item.variant.price.toFixed(2)}`} / pcs
                        </Text>
                      </View>
                      <Caption style={{color: 'red', margin: 0}}>
                        &#9432; NOT ENOUGH STOCK
                      </Caption>
                      <View styleName="horizontal v-center h-end">
                        <View styleName="horizontal">
                          <Button styleName="clear tight">
                            <Caption style={{color: 'red'}}>DEL</Caption>
                          </Button>
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
                    </View>
                  </Row>
                );
              }

              return (
                <Row
                  style={{
                    elevation: 3,
                    marginBottom: 5,
                    padding: 10,
                  }}>
                  <Image
                    style={{
                      backgroundColor: '#f2f2f2',
                      marginRight: 10,
                    }}
                    styleName="medium-square rounded-corners top"
                    source={{
                      uri: item.productPic,
                    }}
                  />
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
                      <Caption
                        style={{color: Colors.Dark, padddingHorizontal: 5}}>
                        {item.purchaseQuantity} PCS
                      </Caption>
                    </View>
                    <View styleName="horizontal v-center h-end">
                      <Button
                        styleName="clear tight"
                        onPress={() => {
                          setSelectedCartProduct(item);
                          setConfirmationAction('delete');
                          setConfirmationInfo('Confirm to Delete ? ');
                          toggleConfirmationVisible(true);
                        }}>
                        <Caption style={{color: 'red'}}>DEL</Caption>
                      </Button>
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
              );
            }}
          />
        )}

        <View styleName="stretch horizontal md-gutter-left md-gutter-right md-gutter-bottom">
          <Button
            styleName="full-width secondary"
            style={{elevation: 3}}
            onPress={() => {
              setConfirmationAction('checkout');
              setConfirmationInfo('Confirm to Checkout ? ');
              toggleConfirmationVisible(true);
            }}>
            <Icon name="loyalty-card" />
            <Text>Checkout Total: RM {totalAmount.toFixed(2)}</Text>
          </Button>
        </View>
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
                if (confirmationAction && confirmationAction === 'delete') {
                  deleteCartProduct();
                } else if (
                  confirmationAction &&
                  confirmationAction === 'checkout'
                ) {
                  checkout();
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

export default CartScreen;
