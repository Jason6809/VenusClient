import React, {useEffect, useState} from 'react';

import {
  Screen,
  View,
  Title,
  Subtitle,
  Text,
  Caption,
  Tile,
  Button,
  Icon,
  Row,
  TouchableOpacity,
  Card,
  Image,
  ImageBackground,
  Divider,
} from '@shoutem/ui';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const COMPONENT = 'SideMenu: ';

const SideMenu = props => {
  console.log(COMPONENT, 'props = ', props);

  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const TAG = 'getUserProfile: ';

    const currentUser = AUTH.currentUser;

    const onUserProfileSnapshot = DATABASE.collection('Users')
      .doc(currentUser.uid)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            console.log(COMPONENT, TAG, 'doc = ', doc.data());

            setUserProfile(doc.data());
          } else {
            console.error(COMPONENT, TAG, 'Doc is not exist...');
          }
        },
        error => {
          console.error(COMPONENT, TAG, 'error = ', error);
        },
      );

    return () => {
      const TAG = 'useEffect Cleanup: ';
      console.log(COMPONENT, TAG, 'start...');

      if (onUserProfileSnapshot) {
        console.log(
          COMPONENT,
          TAG,
          'onUserProfileSnapshot = ',
          onUserProfileSnapshot,
        );

        onUserProfileSnapshot();
      }
    };
  }, []);

  function logout() {
    const TAG = 'logout: ';

    const currentUser = AUTH.currentUser;

    const fcmToken = null;

    DATABASE.collection('UserStatus')
      .doc(currentUser.uid)
      .update({
        fcmToken,
      })
      .then(() => {
        firebase
          .auth()
          .signOut()
          .then(() => {
            console.log(COMPONENT, TAG, 'success...');

            props.navigation.navigate('LoadingScreen');
          });
      })
      .catch(error => {});
  }

  return (
    <View styleName="flexible">
      <ImageBackground
        style={{
          width: '100%',
          height: undefined,
          aspectRatio: 1.5,
        }}
        resizeMode="cover"
        source={{
          uri: userProfile ? userProfile.profile.profilePic : '',
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
          <View styleName="stretch">
            <Row style={{elevation: 3}}>
              <Image
                style={{backgroundColor: '#f2f2f2'}}
                styleName="small rounded-corners"
                source={{
                  uri: userProfile ? userProfile.profile.profilePic : '',
                }}
              />
              <View styleName="vertical stretch v-center">
                <Subtitle>
                  {userProfile &&
                    `${userProfile.profile.firstName} ${
                      userProfile.profile.lastName
                    }`}
                </Subtitle>
                <View styleName="horizontal">
                  <Caption>{userProfile && `${userProfile.email}`}</Caption>
                </View>
              </View>
            </Row>
          </View>
        </Tile>
      </ImageBackground>

      <View>
        <Button
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            paddingBottom: 15,
            paddingTop: 15,
          }}
          styleName="md-gutter"
          onPress={() => {
            props.navigation.navigate('ProfileScreen', {
              userProfile,
            });
          }}>
          <Icon name="user-profile" />
          <Text>Manage Profile</Text>
        </Button>
      </View>

      <View styleName="flexible" />

      <View>
        <Divider styleName="line" />
        <Button
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            paddingBottom: 15,
            paddingTop: 15,
          }}
          styleName="md-gutter"
          onPress={() => {
            logout();
          }}>
          <Icon name="exit-to-app" />
          <Text>Sign Out</Text>
        </Button>
      </View>
    </View>
  );
};

export default SideMenu;
