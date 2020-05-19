import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  ToastAndroid,
} from 'react-native';
import Modal from 'react-native-modal';
import ImagePicker from 'react-native-image-picker';

import {
  Screen,
  View,
  Title,
  Subtitle,
  Text,
  TextInput,
  Caption,
  Tile,
  Button,
  Icon,
  Row,
  TouchableOpacity,
  Card,
  Image,
  ImageBackground,
  Overlay,
  Lightbox,
  Divider,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import moment from 'moment';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const STORAGE = firebase.storage();
const FUNCTIONS = firebase.functions();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'ProfileScreen: ';

const ProfileScreen = props => {
  console.log(SCREEN, 'props = ', props);

  const {userProfile} = props.navigation.state.params;

  const [profilePic, setProfilePic] = useState(userProfile.profile.profilePic);
  const [firstName, setFirstName] = useState(userProfile.profile.firstName);
  const [lastName, setLastName] = useState(userProfile.profile.lastName);
  const [email, setEmail] = useState(userProfile.profile.email);

  const [isLoaderVisible, toggleLoaderVisible] = useState(false);

  const [statusBarColor, setStatusBarColor] = useState(Colors.Misty_Rose);
  const [error, setError] = useState(null);

  useEffect(() => {
    const TAG = 'getUserProfile: ';

    const currentUser = AUTH.currentUser;

    const onUserProfileSnapshot = DATABASE.collection('Users')
      .doc(currentUser.uid)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            console.log(SCREEN, TAG, 'doc = ', doc.data());

            const {email, profile} = doc.data();

            setEmail(email);
            setProfilePic(profile.profilePic);
            setFirstName(profile.firstName);
            setLastName(profile.lastName);
          } else {
            console.error(SCREEN, TAG, 'Doc is not exist...');
          }
        },
        error => {
          console.error(SCREEN, TAG, 'error = ', error);
        },
      );

    return () => {
      const TAG = 'useEffect Cleanup: ';
      console.log(SCREEN, TAG, 'start...');

      if (onUserProfileSnapshot) {
        console.log(
          SCREEN,
          TAG,
          'onUserProfileSnapshot = ',
          onUserProfileSnapshot,
        );

        onUserProfileSnapshot();
      }
    };
  }, []);

  function handleProfilePic() {
    const TAG = 'handleProfilePic: ';

    ImagePicker.showImagePicker({maxWidth: 512}, response => {
      console.log(SCREEN, TAG, 'Response = ', response);

      if (response.didCancel) {
        console.log(SCREEN, TAG, 'User cancelled image picker');
      } else if (response.error) {
        console.log(SCREEN, TAG, 'ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log(
          SCREEN,
          TAG,
          'User tapped custom button: ',
          response.customButton,
        );
      } else {
        // You can also display the image using data:
        // const source = { uri: 'data:image/jpeg;base64,' + response.data };

        setProfilePic(`data:${response.type};base64,${response.data}`);
      }
    });
  }

  async function validation() {
    const TAG = 'validation: ';
    console.log(SCREEN, TAG, 'start... ');

    if (!firstName || firstName === '') {
      const error = {
        errorType: 'displayName',
        errorMsg: 'First Name is Required ! ',
      };

      return Promise.reject(error);
    }

    if (!lastName || lastName === '') {
      const error = {
        errorType: 'displayName',
        errorMsg: 'Last Name is Required ! ',
      };
      return Promise.reject(error);
    }

    if (!email || email === 0) {
      const error = {
        errorType: 'email',
        errorMsg: 'Required ! ',
      };
      return Promise.reject(error);
    }

    setFirstName(firstName.trim());
    setLastName(lastName.trim());

    console.log(SCREEN, TAG, 'finish... ');

    return Promise.resolve();
  }

  async function updateUserProfile() {
    const TAG = 'updateUserProfile: ';
    console.log(SCREEN, TAG, 'start... ');

    try {
      await validation();
    } catch (e) {
      // statements
      return Promise.reject(e);
    }

    toggleLoaderVisible(true);
    setError(null);

    const currentUser = AUTH.currentUser;

    const UserRef = DATABASE.collection('Users').doc(currentUser.uid);

    try {
      await UserRef.update({
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        'profile.profilePic': profilePic,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'UserRef.update: error... ', e);
      return Promise.reject(e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    ToastAndroid.show('Update Successful', ToastAndroid.LONG);

    toggleLoaderVisible(false);
  }

  return (
    <Screen>
      <StatusBar
        backgroundColor={statusBarColor}
        barStyle="dark-content"
        animated={true}
      />

      <View style={{flex: 1, backgroundColor: 'white'}}>
        <ScrollView>
          <ImageBackground
            style={{
              width: '100%',
              height: undefined,
              aspectRatio: 1,
            }}
            resizeMode="cover"
            source={{
              uri: profilePic,
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
                }}
                onOpen={() => {
                  setStatusBarColor('black');
                }}
                onClose={() => {
                  setStatusBarColor(Colors.Misty_Rose);
                }}>
                <Image
                  style={{backgroundColor: '#f2f2f2'}}
                  styleName="medium-square"
                  source={{
                    uri: profilePic,
                  }}
                />
              </Lightbox>
              <View styleName="content">
                <TouchableOpacity
                  onPress={() => {
                    handleProfilePic();
                  }}>
                  <Overlay styleName="image-overlay">
                    <Caption
                      style={{color: 'white', elevation: 3}}
                      styleName="h-center">
                      TAP HERE TO CHANGE PROFILE PIC
                    </Caption>
                  </Overlay>
                </TouchableOpacity>
              </View>
            </Tile>
          </ImageBackground>

          <View styleName="md-gutter">
            <View styleName="stretch sm-gutter-top md-gutter-bottom">
              <Caption>Display Name:</Caption>
              <View styleName="horizontal stretch">
                <TextInput
                  style={{
                    flex: 1,
                    elevation: 3,
                    textAlign: 'center',
                    marginRight: 5,
                  }}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                />

                <TextInput
                  style={{
                    flex: 1,
                    elevation: 3,
                    textAlign: 'center',
                    marginLeft: 5,
                  }}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
              {error && error.errorType === 'displayName' && (
                <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
              )}
            </View>

            <View styleName="stretch sm-gutter-top md-gutter-bottom">
              <Caption>Contact Number:</Caption>
              <View styleName="horizontal stretch">
                <TextInput
                  style={{flex: 1, elevation: 3, textAlign: 'center'}}
                  placeholder="Phone Number"
                  onChangeText={() => {}}
                />
              </View>
              {error && error.errorType === 'price' && (
                <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
              )}
            </View>

            <View styleName="stretch sm-gutter-top md-gutter-bottom">
              <Caption>Email Address:</Caption>
              <View styleName="horizontal stretch">
                <TextInput
                  style={{flex: 1, elevation: 3, textAlign: 'center'}}
                  placeholder="Email"
                  value={email}
                  onChangeText={() => {}}
                />
              </View>
              {error && error.errorType === 'email' && (
                <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
              )}
            </View>

            <View styleName="stretch sm-gutter-top md-gutter-bottom">
              <Caption>Permanent Address:</Caption>
              <View styleName="horizontal stretch">
                <Button
                  style={{elevation: 3}}
                  styleName="full-width"
                  onPress={() => {}}>
                  <Icon name="address" />
                  <Text>Address</Text>
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
        <View
          style={{elevation: 8}}
          styleName="stretch horizontal md-gutter-left md-gutter-right md-gutter-bottom">
          <Button
            styleName="full-width"
            style={{elevation: 3}}
            onPress={() => {
              props.navigation.goBack();
            }}>
            <Icon name="clear-text" />
            <Text>Back</Text>
          </Button>

          <Button
            styleName="full-width secondary"
            style={{elevation: 3}}
            onPress={() => {
              updateUserProfile().catch(error => {
                setError(error);
              });
            }}>
            <Icon name="checkbox-on" />
            <Text>Update</Text>
          </Button>
        </View>
      </View>

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

export default ProfileScreen;
