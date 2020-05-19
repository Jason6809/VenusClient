import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  StatusBar,
  SectionList,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import {
  Screen,
  View,
  Title,
  Subtitle,
  Text,
  Caption,
  Tile,
  Row,
  Card,
  Image,
  Divider,
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

const SCREEN = 'MarketScreen: ';

const MarketScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState(null);
  const [cartProductQty, setCartProductQty] = useState(0);
  const [purchaseOrdersQty, setPurchaseOrdersQty] = useState(0);

  useEffect(() => {
    fetchProducts().catch(error => {
      console.log(SCREEN, 'fetchProducts: error... ', error);
    });
  }, []);

  useEffect(() => {
    const currentUser = AUTH.currentUser;

    const PurchaseOrdersRef = DATABASE.collection('PurchaseOrders');
    const onPurchaseOrdersSnapshot = PurchaseOrdersRef.where(
      'customerUid',
      '==',
      currentUser.uid,
    )
      .where('isCompleted', '==', false)
      .onSnapshot(querySnapshot => {
        const TAG = 'onPurchaseOrdersSnapshot: ';
        console.log(SCREEN, TAG, 'start... ');

        setPurchaseOrdersQty(querySnapshot.size);
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

  useEffect(() => {
    const currentUser = AUTH.currentUser;

    const CartRef = DATABASE.collection('Cart').doc(currentUser.uid);
    const CartProductsRef = CartRef.collection('CartProducts');
    const onCartProductsSnapshot = CartProductsRef.onSnapshot(querySnapshot => {
      const TAG = 'onBookingRequestSnapshot: ';
      console.log(SCREEN, TAG, 'start... ');

      setCartProductQty(querySnapshot.size);
    });

    return () => {
      const TAG = 'useEffect Cleanup: ';
      console.log(SCREEN, TAG, 'start...');

      if (onCartProductsSnapshot) {
        console.log(
          SCREEN,
          TAG,
          'onCartProductsSnapshot = ',
          onCartProductsSnapshot,
        );

        onCartProductsSnapshot();
      }
    };
  }, []);

  async function fetchProducts() {
    const TAG = 'fetchProducts: ';
    console.log(SCREEN, TAG, 'start... ');

    const items = [];

    const ProductTypesRef = DATABASE.collection('ProductTypes');
    try {
      var ProductTypes = await ProductTypesRef.get();
      console.log(SCREEN, TAG, 'ProductTypes = ', ProductTypes);
    } catch (e) {
      console.error(SCREEN, TAG, 'ProductTypes:error... ', e);
      return Promise.reject(e);
    }

    for (const ProductType of ProductTypes.docs) {
      const {productTypeKey, productTypeName} = ProductType.data();

      const title = {productTypeKey, productTypeName};
      const data = [];

      const ProductsRef = DATABASE.collection('Products');

      try {
        var Products = await ProductsRef.where(
          'productTypeKey',
          '==',
          productTypeKey,
        ).get();
        console.log(SCREEN, TAG, 'Products = ', Products);
      } catch (e) {
        console.error(SCREEN, TAG, 'Products:error... ', e);
        return Promise.reject(e);
      }

      if (!Products.empty) {
        const productItems = [];
        for (const Product of Products.docs) {
          const VariantsRef = ProductsRef.doc(Product.id).collection(
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

            productItems.push({
              id: Product.id,
              minPrice,
              maxPrice,
              ...Product.data(),
            });
          }
        }

        if (productItems.length > 0) {
          // statement
          data.push({
            id: productTypeKey,
            productItems,
          });
          console.log(SCREEN, TAG, 'data = ', data);

          items.push({
            title,
            data,
          });
          console.log(SCREEN, TAG, 'items = ', items);
        }
      }
    }

    console.log(SCREEN, TAG, 'items = ', items);

    setProducts(items);
    setRefreshing(false);

    console.log(SCREEN, TAG, 'finish... ');
  }

  async function refresh() {
    const TAG = 'refresh: ';
    console.log(SCREEN, TAG, 'start...');

    setRefreshing(true);

    try {
      // statements
      await fetchProducts();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'fetchProducts: error... ', e);
      return Promise.reject(e);
    }

    console.log(SCREEN, TAG, 'finish...');
  }

  return (
    <Screen style={{backgroundColor: Colors.Misty_Rose}}>
      <StatusBar
        backgroundColor={Colors.Misty_Rose}
        barStyle="dark-content"
        animated={true}
      />

      {purchaseOrdersQty > 0 && (
        <View
          style={{
            elevation: 3,
            backgroundColor: Colors.Misty_Rose,
            paddingTop: 0,
            paddingBottom: 5,
            paddingHorizontal: 10,
          }}>
          <Row style={{elevation: 3, paddingHorizontal: 5}}>
            <Icon style={{margin: 10}} name="history" />
            <View styleName="vertical">
              <Subtitle style={{margin: 0, color: 'red'}}>
                &#9432; REMINDER
              </Subtitle>
              <Caption style={{margin: 0, color: Colors.Dark}}>
                &bull; You have {purchaseOrdersQty} item(s) yet to be received.
              </Caption>
            </View>
            <Button
              styleName="right-icon tight"
              onPress={() => {
                props.navigation.navigate('PurchaseOrdersScreen');
              }}>
              <Text>VIEW</Text>
              <Icon style={{margin: 0}} name="right-arrow" />
            </Button>
          </Row>
        </View>
      )}

      <View styleName="flexible stretch">
        {!products && (
          <View styleName="flexible stretch horizontal v-center h-center">
            <Image source={require('../assets/loader_small.gif')} />
            <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
              LOADING...
            </Caption>
          </View>
        )}

        {products && (
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
            sections={products}
            keyExtractor={item => item.id}
            renderSectionHeader={({section: {title}}) => (
              <View styleName="horizontal v-center space-between lg-gutter-top md-gutter-bottom md-gutter-left md-gutter-right">
                <Title>{title.productTypeName}</Title>

                <Button
                  style={{elevation: 3}}
                  styleName="secondary"
                  onPress={() => {
                    props.navigation.navigate('ProductSearchScreen', {
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
                data={item.productItems}
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
                        uri: item.productPic,
                      }}
                    />
                    <View styleName="content" style={{flex: 0}}>
                      <Subtitle
                        style={{
                          marginBottom: 5,
                          lineHeight: 20,
                        }}
                        styleName="h-center">
                        {item.productName}
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
                            props.navigation.navigate('ProductItemScreen', {
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
      <Button
        styleName="full-width secondary horizontal v-center"
        style={{
          width: 65,
          height: 40,
          padding: 10,
          borderRadius: 2,
          elevation: 3,
          position: 'absolute',
          bottom: 15,
          right: 15,
          justifyContent: 'space-around',
        }}
        onPress={() => {
          props.navigation.navigate('CartScreen');
        }}>
        <Icon style={{margin: 0}} name="cart" />
        <Subtitle style={{color: 'white'}}>{cartProductQty}</Subtitle>
      </Button>
    </Screen>
  );
};

MarketScreen.navigationOptions = () => ({
  
});

export default MarketScreen;
