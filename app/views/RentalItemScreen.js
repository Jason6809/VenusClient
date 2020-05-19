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

const SCREEN = 'RentalItemScreen: ';

const RentalItemScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const {
    id,
    itemPic,
    itemName,
    itemTypeKey,
    itemTypeName,
    stylistUid,
    isAllowedRenting,
  } = props.navigation.state.params;

  const [isPeriodPickerVisible, togglePeriodPicker] = useState(false);
  const [isLoaderVisible, toggleLoaderVisible] = useState(false);

  const [stylist, setStylist] = useState(null);
  const [variants, setVariants] = useState(null);

  const [selectedVariant, setSelectVariant] = useState(null);
  const [rentalPeriod, setRentalPeriod] = useState('1');

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
    async function getRentalItemVariants() {
      const TAG = 'getRentalItemVariants:';
      console.log(SCREEN, TAG, 'start... ');

      const RentalItemRef = DATABASE.collection('RentalItems').doc(id);

      const VariantsRef = RentalItemRef.collection('Variants');
      try {
        var Variants = await VariantsRef.orderBy('price').get();
        console.log(SCREEN, TAG, 'Variants = ', Variants);
      } catch (e) {
        console.error(SCREEN, 'Variants: error...', e);
        return Promise.reject(e);
      }

      const items = [];
      for (const Variant of Variants.docs) {
        console.log(SCREEN, TAG, 'Variant = ', Variant);

        const RentalRequestRef = DATABASE.collection('RentalRequest');

        try {
          var RentalRequest = await RentalRequestRef.where('itemUid', '==', id)
            .where('stylistUid', '==', stylistUid)
            .where('variantKey', '==', Variant.id)
            .get();
          console.log(SCREEN, TAG, 'RentalRequest = ', RentalRequest);
        } catch (e) {
          // statements
          console.log(SCREEN, TAG, 'RentalRequest:error... ', e);
          return Promise.reject(e);
        }

        if (RentalRequest.empty) {
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
      }

      setVariants(items);
      console.log(SCREEN, TAG, 'finish... ');
    }

    getRentalItemVariants().catch(error => {
      console.log(SCREEN, 'getRentalItemVariants: error... ', error);
    });
  }, []);

  async function getFcmToken() {
    const TAG = 'getFcmToken: ';
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

  async function createRentalRequest() {
    const TAG = 'createRentalRequest: ';
    console.log(SCREEN, TAG, 'start... ');

    toggleLoaderVisible(true);

    const currentUser = AUTH.currentUser;

    const rentalRequest = {
      stylistUid: stylistUid,
      itemTypeKey: itemTypeKey,
      itemTypeName: itemTypeName,
      itemUid: id,
      itemName,
      itemPic,
      variant: {
        variantName: selectedVariant.variantName,
        price: selectedVariant.price,
      },
      variantKey: selectedVariant.id,
      rentalPeriod: parseInt(rentalPeriod),
      createdDatetime: new Date(),
      isCompleted: false,
      status: false,
    };

    console.log(SCREEN, TAG, 'rentalRequest = ', rentalRequest);

    DATABASE.collection('RentalRequest')
      .doc(currentUser.uid)
      .set(rentalRequest)
      .then(async result => {
        console.log(SCREEN, TAG, 'complete... ');

        try {
          var stylistFcmToken = await getFcmToken();
          console.log(SCREEN, 'stylistFcmToken = ', stylistFcmToken);
        } catch (e) {
          console.error(SCREEN, 'getFcmToken: error...', e);
          return Promise.reject(e);
        }

        if (stylistFcmToken) {
          const sendMessage = FUNCTIONS.httpsCallable('sendMessage');

          try {
            await sendMessage({
              fcmToken: stylistFcmToken,
              title: 'Heads Up !',
              body: 'You have a new Rental Request',
            });
            console.log(SCREEN, 'sendMessage: success....');
          } catch (e) {
            console.error(SCREEN, 'sendMessage: error....', e);
            return Promise.reject(e);
          }
        }

        ToastAndroid.show('Request Sent Successful', ToastAndroid.LONG);

        toggleLoaderVisible(false);

        props.navigation.popToTop();
      });
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
              uri: itemPic,
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
                    uri: itemPic,
                  }}
                />
              </Lightbox>
              <View styleName="content">
                <Overlay styleName="image-overlay">
                  <Subtitle
                    style={{color: 'white', elevation: 3}}
                    styleName="h-center">
                    {itemName}
                  </Subtitle>
                </Overlay>
              </View>
            </Tile>
          </ImageBackground>

          <View styleName="stretch lg-gutter-top md-gutter-left md-gutter-right ">
            <Title styleName="md-gutter-bottom">Seller</Title>

            {!stylist && (
              <View styleName="lg-gutter stretch horizontal v-center h-center">
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
              <Caption style={{color: Colors.Dark}}>RENT</Caption>
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

            {variants && variants.length <= 0 && (
              <View>
                <Divider styleName="line" />
                <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                  <Caption style={{color: 'red'}}>
                    SORRY... FULLY RENTED...
                  </Caption>
                </View>
                <Divider styleName="line" />
              </View>
            )}

            {variants &&
              variants.length > 0 &&
              variants.map(value => (
                <View key={value.id}>
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal v-center space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {value.variantName}
                      </Caption>
                    </View>

                    <View styleName="flexible horizontal h-end">
                      <Caption style={{color: 'red'}}>
                        RM {value.price.toFixed(2)} / day
                      </Caption>
                    </View>

                    <View styleName="flexible horizontal h-end">
                      <Button
                        styleName={
                          isAllowedRenting ? 'tight clear' : 'tight muted'
                        }
                        onPress={() => {
                          setSelectVariant(value);
                          togglePeriodPicker(true);
                        }}
                        disabled={!isAllowedRenting}>
                        <Icon name="products" />
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
        isVisible={isPeriodPickerVisible}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
        onBackdropPress={() => {
          togglePeriodPicker(false);
        }}
        onBackButtonPress={() => {
          togglePeriodPicker(false);
        }}>
        <View style={{backgroundColor: 'white', padding: 15}}>
          <View styleName="stretch">
            <Subtitle styleName="sm-gutter-bottom">RENTAL PERIOD</Subtitle>
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
                  placeholder="0 DAY(S)"
                  value={rentalPeriod}
                  onChangeText={setRentalPeriod}
                />
              </View>
              {error && error.errorType === 'rentalPeriod' && (
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
                togglePeriodPicker(false);
                setError(null);
              }}>
              <Icon name="clear-text" />
              <Text>NO</Text>
            </Button>

            <Button
              style={{elevation: 3}}
              styleName="full-width secondary"
              onPress={() => {
                if (!rentalPeriod && rentalPeriod === '') {
                  setError({
                    errorType: 'rentalPeriod',
                    errorMsg: 'Required !',
                  });
                } else {
                  if (parseInt(rentalPeriod) < 1) {
                    setError({
                      errorType: 'rentalPeriod',
                      errorMsg: 'Minimum Rental Day must be more than 1 day ! ',
                    });
                  } else {
                    if (selectedVariant) {
                      createRentalRequest();
                      togglePeriodPicker(false);
                      setError(null);
                    } else {
                      console.error(SCREEN, 'selectedVariant is undefined. ');
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

export default RentalItemScreen;
