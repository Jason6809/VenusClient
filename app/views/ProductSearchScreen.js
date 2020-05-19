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

const SCREEN = 'ProductSearchScreen: ';

const ProductSearchScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const {productTypeKey, productTypeName} = props.navigation.state.params;

  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState(null);
  const [productTypes, setProductTypes] = useState(null);

  const [selectedProductType, setSelectedProductType] = useState({
    productTypeKey,
    productTypeName,
  });

  const [isTypesPickerVisible, toggleTypesPickerVisible] = useState(false);
  const [isPriceAscending, togglePriceAscending] = useState(true);

  useEffect(() => {
    async function getProductTypes() {
      const TAG = 'getProductTypes: ';

      const ProductTypesRef = DATABASE.collection('ProductTypes');

      try {
        var ProductTypes = await ProductTypesRef.orderBy(
          'productTypeKey',
        ).get();
        console.log(SCREEN, TAG, 'ProductTypes = ', ProductTypes);
      } catch (e) {
        // statements
        console.error(SCREEN, TAG, 'ProductTypes:error...', e);
        return Promise.reject(e);
      }

      const items = [];
      for (const ProductType of ProductTypes.docs) {
        console.log(SCREEN, TAG, 'ProductType = ', ProductType);

        items.push({
          ...ProductType.data(),
        });
      }

      console.log(SCREEN, TAG, 'items = ', items);

      setProductTypes(items);

      console.log(SCREEN, TAG, 'finish... ');
    }

    getProductTypes().catch(error => {
      console.log(SCREEN, 'getProductTypes:error... ', error);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedProductType]);

  async function fetchData() {
    const TAG = 'fetchData: ';
    console.log(SCREEN, TAG, 'start... ');

    const ProductsRef = DATABASE.collection('Products');

    try {
      var Products = await ProductsRef.where(
        'productTypeKey',
        '==',
        selectedProductType.productTypeKey,
      ).get();
      console.log(SCREEN, TAG, 'Products = ', Products);
    } catch (e) {
      console.error(SCREEN, TAG, 'Products:error... ', e);
      return Promise.reject(e);
    }

    const items = [];

    if (!Products.empty) {
      for (const Product of Products.docs) {
        const VariantsRef = ProductsRef.doc(Product.id).collection('Variants');

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
            id: Product.id,
            minPrice,
            maxPrice,
            ...Product.data(),
          });
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
                sorting(products);
              }}>
              <Icon name={!isPriceAscending ? 'up-arrow' : 'down-arrow'} />
              <Text>Price</Text>
            </Button>

            <Button
              styleName="full-width secondary"
              onPress={() => {
                toggleTypesPickerVisible(true);
              }}>
              <Text>{selectedProductType.productTypeName}</Text>
              <Icon name="drop-down" />
            </Button>
          </View>
          <Divider styleName="line" />
        </View>

        <View styleName="flexible">
          {!products && (
            <View styleName="flexible stretch horizontal h-center v-center">
              <Image source={require('../assets/loader_small.gif')} />
              <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
                LOADING...
              </Caption>
            </View>
          )}

          {products && products.length <= 0 && (
            <View styleName="flexible stretch vertical v-center">
              <Caption styleName="horizontal h-center sm-gutter-top">
                SORRY... NO PRODUCTS AVAILABLE YET...
              </Caption>
              <Button
                styleName="xl-gutter clear"
                onPress={() => {
                  setProducts(null);
                  refresh();
                }}>
                <Icon name="refresh" />
                <Text>Tap here to refresh</Text>
              </Button>
            </View>
          )}

          {products && products.length > 0 && (
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
              data={products}
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
            data={productTypes}
            keyExtractor={item => item.productTypeKey}
            renderItem={({item}) => (
              <Button
                style={{elevation: 3}}
                styleName="secondary md-gutter-bottom"
                onPress={() => {
                  setSelectedProductType(item);
                  setProducts(null);
                  // fetchData();
                  toggleTypesPickerVisible(false);
                }}>
                <Text>{item.productTypeName}</Text>
              </Button>
            )}
          />
        </View>
      </Modal>
    </Screen>
  );
};

export default ProductSearchScreen;
