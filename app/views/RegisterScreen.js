import React, {useState} from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  AsyncStorage,
} from 'react-native';

import {
  Screen,
  View,
  Title,
  Subtitle,
  Text,
  Tile,
  TextInput,
  Button,
} from '@shoutem/ui';

import Footer from '../components/Footer';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const FUNCTIONS = firebase.functions();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'RegisterScreen: ';

const RegisterScreen = props => {
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);

  async function registerUser() {
    const TAG = 'registerUser: ';
    console.log(SCREEN, TAG, 'start...');
    console.log(SCREEN, TAG, 'email = ', email);
    console.log(SCREEN, TAG, 'password = ', password);

    AUTH.createUserWithEmailAndPassword(email, password)
      .then(userCred => {
        console.log(SCREEN, TAG, 'userCred = ', userCred);

        const userStatus = {
          fcmToken: null,
        };

        const userProfile = {
          isStylist: false,
          isAdmin: false,
          email: email,
          datetime: new Date(),
          profile: {
            firstName: firstName,
            lastName: lastName,
            profilePic: '',
          },
        };

        const setUserStatus = DATABASE.collection('UserStatus')
          .doc(userCred.user.uid)
          .set(userStatus);

        const setUserProfile = DATABASE.collection('Users')
          .doc(userCred.user.uid)
          .set(userProfile);

        return Promise.all(setUserStatus, setUserProfile);
      })
      .then(() => {
        console.log(SCREEN, TAG, 'success...');

        props.navigation.navigate('LoadingScreen');
      })
      .catch(error => {
        console.error(SCREEN, TAG, 'failed...');
        console.error(SCREEN, TAG, 'error = ', error);
      });
  }

  return (
    <Screen>
      <StatusBar
        backgroundColor="white"
        barStyle="dark-content"
        animated={true}
      />
      <View style={styles.titleView}>
        <Tile styleName="text-centric">
          <Title>PROJECT VENUS</Title>
          <Subtitle>Register</Subtitle>
        </Tile>
      </View>

      <KeyboardAvoidingView
        style={styles.registerFormView}
        behavior="padding"
        enabled>
        <View styleName="vertical v-start lg-gutter">
          <View styleName="horizontal h-center md-gutter-bottom">
            <TextInput
              styleName="flexible sm-gutter-right"
              placeholder={'First Name'}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              styleName="flexible sm-gutter-left"
              placeholder={'Last Name'}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
          <TextInput
            style={styles.emailTextInput}
            placeholder={'Email'}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.passwordTextInput}
            placeholder={'Password'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button
            styleName="secondary md-gutter-bottom"
            onPress={() => {
              registerUser();
            }}>
            <Text>REGISTER</Text>
          </Button>
          <Button
            styleName="clear"
            onPress={() => {
              props.navigation.navigate('LoginScreen');
            }}>
            <Text>LOGIN</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Footer />
    </Screen>
  );
};

const styles = StyleSheet.create({
  titleView: {
    flex: 1,
  },
  registerFormView: {
    flex: 2,
  },
  emailTextInput: {
    marginBottom: 15,
  },
  passwordTextInput: {
    marginBottom: 15,
  },
});

export default RegisterScreen;
