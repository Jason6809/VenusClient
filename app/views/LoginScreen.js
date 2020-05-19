import React, {useState} from 'react';
import {StyleSheet, KeyboardAvoidingView, StatusBar, Alert} from 'react-native';

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

const SCREEN = 'LoginScreen: ';

const LoginScreen = props => {
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);

  function loginUser() {
    const TAG = 'loginUser: ';
    console.log(SCREEN, TAG, 'start...');
    console.log(SCREEN, TAG, 'email = ', email);
    console.log(SCREEN, TAG, 'password = ', password);

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(
        userCred => {
          setEmail('');
          setPassword('');

          console.log(SCREEN, TAG, 'success...');
          console.log(SCREEN, TAG, 'userCred = ', userCred.user);

          props.navigation.navigate('LoadingScreen');
        },
        error => {
          console.error(SCREEN, TAG, 'failed...');
          console.log(SCREEN, TAG, 'error = ', error);
        },
      );
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
          <Subtitle>Login</Subtitle>
        </Tile>
      </View>

      <KeyboardAvoidingView
        style={styles.loginFormView}
        behavior="padding"
        enabled>
        <View styleName="vertical v-start lg-gutter">
          <TextInput
            style={styles.emailTextInput}
            placeholder={'Email'}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.emailTextInput}
            placeholder={'Password'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button
            styleName="secondary md-gutter-bottom"
            onPress={() => {
              loginUser();
            }}>
            <Text>LOGIN</Text>
          </Button>
          <Button
            styleName="clear"
            onPress={() => {
              props.navigation.navigate('RegisterScreen');
            }}>
            <Text>REGISTER</Text>
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
  loginFormView: {
    flex: 2,
  },
  emailTextInput: {
    marginBottom: 15,
  },
  passwordTextInput: {
    marginBottom: 15,
  },
});

export default LoginScreen;
