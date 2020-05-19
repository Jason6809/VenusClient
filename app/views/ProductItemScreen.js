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

const SCREEN = 'ProductItemScreen: ';

const ProductItemScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const {
    id,
    productPic,
    productName,
    productTypeKey,
    productTypeName,
    stylistUid,
  } = props.navigation.state.params;

  const [isQuantityPickerVisible, toggleQuantityPicker] = useState(false);
  const [isLoaderVisible, toggleLoaderVisible] = useState(false);

  const [stylist, setStylist] = useState(null);
  const [variants, setVariants] = useState(null);

  const [selectedVariant, setSelectVariant] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState('1');

  const [error, setError] = useState({
    errorType: null,
    errorMsg: null,
  });

  useEffect(() => {
    async function getStylistProfile() {
      const TAG = 'getStylistProfile: ';
      console.log(SCREEN, TAG, 'start... ');

      const UserRef = DATABASE.collection('Users');
      try {
        var Stylist = await UserRef.doc(stylistUid).get();
        console.log(SCREEN, TAG, 'Stylist = ', Stylist);
      } catch (e) {
        // statements
        console.error(SCREEN, TAG, 'stylist:error... ', e);
        return Promise.reject(e);
      }

      setStylist(Stylist.data());
      console.log(SCREEN, TAG, 'finish... ');
    }

    getStylistProfile();
  }, []);

  useEffect(() => {
    async function getProductVariants() {
      const TAG = 'getProductVariants:';
      console.log(SCREEN, TAG, 'start... ');

      const ProductRef = DATABASE.collection('Products').doc(id);

      const VariantsRef = ProductRef.collection('Variants');
      try {
        var Variants = await VariantsRef.orderBy('price').get();
        console.log(SCREEN, TAG, 'Variants = ', Variants);
      } catch (e) {
        console.error(SCREEN, 'Variants: error...', e);
        return Promise.reject(e);
      }

      const items = [];
      for (const Variant of Variants.docs) {
        const PhotosRef = VariantsRef.doc(Variant.id).collection('Photos');
        try {
          var Photos = await PhotosRef.get();
          console.log(SCREEN, TAG, 'Photos = ', Photos);
        } catch (e) {
          // statements
          console.error(SCREEN, 'Photos: error...', e);
          return Promise.reject(e);
        }

        if (Photos.empty) {
          items.push({
            id: Variant.id,
            ...Variant.data(),
            photos: null,
          });
        } else {
          items.push({
            id: Variant.id,
            ...Variant.data(),
            photos: Photos.docs,
          });
        }
      }

      setVariants(items);
      console.log(SCREEN, TAG, 'finish... ');
    }

    getProductVariants().catch(error => {});
  }, []);

  async function addToCart() {
    const TAG = 'addToCart: ';
    console.log(SCREEN, TAG, 'start..');

    toggleLoaderVisible(true);

    const currentUser = AUTH.currentUser;

    const CartRef = DATABASE.collection('Cart').doc(currentUser.uid);
    const ProductsRef = CartRef.collection('CartProducts');

    try {
      await ProductsRef.add({
        customerUid: currentUser.uid,
        productUid: id,
        stylistUid,
        purchaseQuantity: parseInt(purchaseQuantity),
        variantKey: selectedVariant.id,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
      return Promise.reject(e);
    }

    ToastAndroid.show('Added to Cart', ToastAndroid.LONG);

    toggleLoaderVisible(false);

    console.log(SCREEN, TAG, 'finish..');
  }

  return (
    <Screen>
      <StatusBar
        backgroundColor="black"
        barStyle="light-content"
        animated={true}
      />

      <View style={{flex: 1, backgroundColor: 'white'}}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 45,
          }}>
          <ImageBackground
            style={{
              width: '100%',
              height: undefined,
              aspectRatio: 1,
            }}
            resizeMode="cover"
            source={{
              uri: productPic,
            }}>
            <Tile
              style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'flex-end',
                paddingBottom: 15,
                paddingLeft: 15,
                paddingRight: 15,
              }}>
              <Lightbox
                style={{elevation: 3, padding: 5, backgroundColor: '#f2f2f2'}}
                activeProps={{
                  style: {
                    flex: 1,
                    width: '100%',
                  },
                  resizeMode: 'contain',
                }}>
                <Image
                  style={{backgroundColor: '#f2f2f2'}}
                  styleName="medium-square"
                  source={{
                    uri: productPic,
                  }}
                />
              </Lightbox>
              <View styleName="content">
                <Overlay styleName="image-overlay">
                  <Subtitle
                    style={{color: 'white', elevation: 3}}
                    styleName="h-center">
                    {productName}
                  </Subtitle>
                </Overlay>
              </View>
            </Tile>
          </ImageBackground>

          <View styleName="stretch lg-gutter-top md-gutter-left md-gutter-right ">
            <Title styleName="md-gutter-bottom">Seller</Title>

            {!stylist && (
              <View styleName="lg-gutter stretch horizontal h-center v-center">
                <Image source={require('../assets/loader_small.gif')} />
                <Caption
                  style={{color: Colors.Dark}}
                  styleName="md-gutter-left">
                  LOADING...
                </Caption>
              </View>
            )}

            {stylist && (
              <Row style={{elevation: 3}}>
                <Image
                  style={{backgroundColor: 'white'}}
                  styleName="small rounded-corners"
                  source={{
                    uri: stylist.profile.profilePic,
                  }}
                />
                <View styleName="vertical stretch v-center">
                  <Subtitle>
                    {`${stylist.profile.firstName} ${stylist.profile.lastName}`}
                  </Subtitle>
                  <View styleName="horizontal">
                    <Caption>{stylist.email}</Caption>
                  </View>
                </View>
              </Row>
            )}
          </View>

          <View styleName="stretch lg-gutter-top md-gutter-left md-gutter-right ">
            <Title styleName="md-gutter-bottom">Variants</Title>
            <Divider styleName="section-header">
              <Caption style={{color: Colors.Dark}}>VARIANT</Caption>
              <Caption style={{color: Colors.Dark}}>PRICE</Caption>
              <Caption style={{color: Colors.Dark}}>QTY</Caption>
              <Caption style={{color: Colors.Dark}}>ADD</Caption>
            </Divider>

            {!variants && (
              <View>
                <Divider styleName="line" />
                <View styleName="md-gutter stretch horizontal h-center v-center">
                  <Image source={require('../assets/loader_small.gif')} />
                  <Caption
                    style={{color: Colors.Dark}}
                    styleName="md-gutter-left">
                    LOADING...
                  </Caption>
                </View>
                <Divider styleName="line" />
              </View>
            )}

            {variants &&
              variants.map(value => (
                <View key={value.id}>
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal v-center space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {value.variantName}
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-center">
                      <Caption style={{color: 'red'}}>
                        RM {value.price.toFixed(2)}
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Caption>{value.quantity} PCS</Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Button
                        styleName="tight clear"
                        onPress={() => {
                          setSelectVariant(value);
                          toggleQuantityPicker(true);
                        }}>
                        <Icon name="add-to-cart" />
                      </Button>
                    </View>
                  </View>

                  {!value.photos && (
                    <View
                      styleName="flexible stretch"
                      style={{
                        padding: 5,
                        height: 109,
                      }}>
                      <View styleName="flexible stretch vertical v-center h-center">
                        <Caption>SORRY... NO PHOTOS AVAILABLE YET...</Caption>
                      </View>
                    </View>
                  )}

                  {value.photos && (
                    <FlatList
                      horizontal={true}
                      contentContainerStyle={{
                        paddingBottom: 5,
                      }}
                      data={value.photos}
                      keyExtractor={item => item.id}
                      renderItem={({item}) => (
                        <Lightbox
                          style={{
                            marginTop: 1,
                            marginBottom: 10,
                            marginLeft: 5,
                            marginRight: 5,
                            padding: 5,
                            elevation: 3,
                            backgroundColor: '#f2f2f2',
                          }}
                          activeProps={{
                            style: {
                              flex: 1,
                              width: '100%',
                            },
                            resizeMode: 'contain',
                          }}>
                          <Image
                            styleName="medium"
                            source={{
                              uri: item.data().uri,
                            }}
                          />
                        </Lightbox>
                      )}
                    />
                  )}

                  <Divider styleName="line" />
                </View>
              ))}
          </View>
        </ScrollView>
      </View>

      <Modal
        isVisible={isQuantityPickerVisible}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
        onBackdropPress={() => {
          toggleQuantityPicker(false);
        }}
        onBackButtonPress={() => {
          toggleQuantityPicker(false);
        }}>
        <View style={{backgroundColor: 'white', padding: 15}}>
          <View styleName="stretch">
            <Subtitle styleName="sm-gutter-bottom">INPUT QUANTITY</Subtitle>
          </View>

          <View styleName="stretch sm-gutter-top md-gutter-bottom">
            <Divider styleName="line" />
            <View styleName="lg-gutter-top lg-gutter-bottom">
              <View styleName="horizontal stretch">
                <TextInputMask
                  customTextInput={TextInput}
                  customTextInputProps={{
                    style: {
                      elevation: 3,
                      flex: 1,
                      textAlign: 'center',
                    },
                  }}
                  type="only-numbers"
                  placeholder="0 PCS"
                  value={purchaseQuantity}
                  onChangeText={setPurchaseQuantity}
                />
              </View>
              {error && error.errorType === 'purchaseQuantity' && (
                <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
              )}
            </View>
            <Divider styleName="line" />
          </View>

          <View styleName="stretch horizontal">
            <Button
              style={{elevation: 3}}
              styleName="full-width"
              onPress={() => {
                toggleQuantityPicker(false);
                setError(null);
              }}>
              <Icon name="clear-text" />
              <Text>NO</Text>
            </Button>

            <Button
              style={{elevation: 3}}
              styleName="full-width secondary"
              onPress={() => {
                if (!purchaseQuantity && purchaseQuantity === '') {
                  setError({
                    errorType: 'purchaseQuantity',
                    errorMsg: 'Required !',
                  });
                } else {
                  if (parseInt(purchaseQuantity) < 1) {
                    setError({
                      errorType: 'purchaseQuantity',
                      errorMsg:
                        'Minimum Purchase Quantity must be more than 0 PCS ! ',
                    });
                  } else {
                    if (purchaseQuantity > selectedVariant.quantity) {
                      setError({
                        errorType: 'purchaseQuantity',
                        errorMsg: 'Not enough Stock ! ',
                      });
                    } else {
                      if (selectedVariant) {
                        addToCart();
                        toggleQuantityPicker(false);
                        setError(null);
                      } else {
                        console.error(SCREEN, 'selectedVariant is undefined. ');
                      }
                    }
                  }
                }
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

export default ProductItemScreen;
