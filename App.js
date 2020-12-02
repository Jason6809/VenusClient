import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, AsyncStorage } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import { createDrawerNavigator, DrawerActions } from 'react-navigation-drawer';
import createAnimatedSwitchNavigator from 'react-navigation-animated-switch';
import { Transition } from 'react-native-reanimated';
import 'react-native-gesture-handler';

import { Screen, View, Button, Text, Title, Caption, Icon } from '@shoutem/ui';

import Colors from './app/constants/Colors';

import SideMenu from './app/components/SideMenu';

import LoadingScreen from './app/views/LoadingScreen';
import LoginScreen from './app/views/LoginScreen';
import RegisterScreen from './app/views/RegisterScreen';
import ProfileScreen from './app/views/ProfileScreen';
import BookingScreen from './app/views/BookingScreen';
import BookingDetailScreen from './app/views/BookingDetailScreen';
import ServicesScreen from './app/views/ServicesScreen';
import StylistScreen from './app/views/StylistScreen';
import AppointmentHistoryScreen from './app/views/AppointmentHistoryScreen';
import MarketScreen from './app//views/MarketScreen';
import ProductItemScreen from './app/views/ProductItemScreen';
import CartScreen from './app/views/CartScreen';
import ProductSearchScreen from './app/views/ProductSearchScreen';
import PurchaseOrdersScreen from './app/views/PurchaseOrdersScreen';
import PurchaseHistoryScreen from './app/views/PurchaseHistoryScreen';
import RentalScreen from './app//views/RentalScreen';
import RentalDetailScreen from './app/views/RentalDetailScreen';
import RentalItemScreen from './app/views/RentalItemScreen';
import RentalSearchScreen from './app/views/RentalSearchScreen';
import RentalHistoryScreen from './app/views/RentalHistoryScreen';

const SCREEN = 'App.js: ';

const BookingStack = createStackNavigator(
  {
    BookingScreen: {
      screen: BookingScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.dispatch(DrawerActions.toggleDrawer());
            }}>
            <Icon name="sidebar" />
            <Title>BOOKING</Title>
          </Button>
        ),
        headerRight: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.navigate('AppointmentHistoryScreen');
            }}>
            <Icon name="history" />
          </Button>
        ),
        headerStyle: {
          elevation: 0,
          backgroundColor: Colors.Misty_Rose,
        },
      }),
    },
    BookingDetailScreen: {
      screen: BookingDetailScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>DETAILS</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon style={{ marginRight: 0 }} name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 3,
        },
      }),
    },
    ServicesScreen: {
      screen: ServicesScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>SERVICES MENU</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon style={{ marginRight: 0 }} name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 0,
        },
      }),
    },
    StylistScreen: {
      screen: StylistScreen,
      navigationOptions: ({ navigation }) => ({
        headerLeft: (
          <Button
            styleName="secondary"
            style={{
              elevation: 3,
              padding: 10,
              marginLeft: 15,
            }}
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon style={{ marginRight: 0 }} name="back" />
          </Button>
        ),
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
        },
      }),
    },
    AppointmentHistoryScreen: {
      screen: AppointmentHistoryScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>HISTORY</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 3,
        },
      }),
    },
  },
  {
    navigationOptions: ({ navigation }) => ({
      swipeEnabled:
        navigation.state.routes[navigation.state.index].routeName ===
        'BookingScreen',
      tabBarVisible:
        navigation.state.routes[navigation.state.index].routeName ===
        'BookingScreen',
    }),
  },
);

const MarketStack = createStackNavigator(
  {
    MarketScreen: {
      screen: MarketScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.dispatch(DrawerActions.toggleDrawer());
            }}>
            <Icon name="sidebar" />
            <Title>MARKET</Title>
          </Button>
        ),
        headerStyle: {
          elevation: 0,
          backgroundColor: Colors.Misty_Rose,
        },
        headerRight: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.navigate('PurchaseHistoryScreen');
            }}>
            <Icon name="history" />
          </Button>
        ),
      }),
    },
    ProductItemScreen: {
      screen: ProductItemScreen,
      navigationOptions: ({ navigation }) => ({
        headerLeft: (
          <Button
            styleName="secondary"
            style={{
              elevation: 3,
              padding: 10,
              marginLeft: 15,
            }}
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon style={{ marginRight: 0 }} name="back" />
          </Button>
        ),
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
        },
      }),
    },
    CartScreen: {
      screen: CartScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>CART</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon style={{ marginRight: 0 }} name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 0,
          backgroundColor: Colors.Misty_Rose,
        },
      }),
    },
    ProductSearchScreen: {
      screen: ProductSearchScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>PRODUCTS MENU</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon style={{ marginRight: 0 }} name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 0,
        },
      }),
    },
    PurchaseOrdersScreen: {
      screen: PurchaseOrdersScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>PURCHASE ORDERS</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 3,
        },
      }),
    },
    PurchaseHistoryScreen: {
      screen: PurchaseHistoryScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>HISTORY</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 3,
        },
      }),
    },
  },
  {
    navigationOptions: ({ navigation }) => ({
      swipeEnabled:
        navigation.state.routes[navigation.state.index].routeName ===
        'MarketScreen',
      tabBarVisible:
        navigation.state.routes[navigation.state.index].routeName ===
        'MarketScreen',
    }),
  },
);

const RentalStack = createStackNavigator(
  {
    RentalScreen: {
      screen: RentalScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.dispatch(DrawerActions.toggleDrawer());
            }}>
            <Icon name="sidebar" />
            <Title>RENTAL</Title>
          </Button>
        ),
        headerRight: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.navigate('RentalHistoryScreen');
            }}>
            <Icon name="history" />
          </Button>
        ),
        headerStyle: {
          elevation: 0,
          backgroundColor: Colors.Misty_Rose,
        },
      }),
    },
    RentalDetailScreen: {
      screen: RentalDetailScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>DETAILS</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon style={{ marginRight: 0 }} name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 3,
        },
      }),
    },
    RentalItemScreen: {
      screen: RentalItemScreen,
      navigationOptions: ({ navigation }) => ({
        headerLeft: (
          <Button
            styleName="secondary"
            style={{
              elevation: 3,
              padding: 10,
              marginLeft: 15,
            }}
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon style={{ marginRight: 0 }} name="back" />
          </Button>
        ),
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
        },
      }),
    },
    RentalSearchScreen: {
      screen: RentalSearchScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>RENTAL ITEMS MENU</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon style={{ marginRight: 0 }} name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 0,
        },
      }),
    },
    RentalHistoryScreen: {
      screen: RentalHistoryScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>HISTORY</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 3,
        },
      }),
    },
  },
  {
    navigationOptions: ({ navigation }) => ({
      swipeEnabled:
        navigation.state.routes[navigation.state.index].routeName ===
        'RentalScreen',
      tabBarVisible:
        navigation.state.routes[navigation.state.index].routeName ===
        'RentalScreen',
    }),
  },
);

const HomeStack = createMaterialTopTabNavigator(
  {
    Market: {
      screen: MarketStack,
      navigationOptions: {
        tabBarIcon: ({ focused }) => {
          return focused === true ? (
            <Icon name="cart" style={styles.active} />
          ) : (
              <Icon name="cart" />
            );
        },
      },
    },

    Booking: {
      screen: BookingStack,
      navigationOptions: {
        tabBarIcon: ({ focused }) => {
          return focused === true ? (
            <Icon name="add-event" style={styles.active} />
          ) : (
              <Icon name="add-event" />
            );
        },
      },
    },

    Rental: {
      screen: RentalStack,
      navigationOptions: {
        tabBarIcon: ({ focused }) => {
          return focused === true ? (
            <Icon name="products" style={styles.active} />
          ) : (
              <Icon name="products" />
            );
        },
      },
    },
  },
  {
    initialRouteName: 'Booking',
    swipeEnabled: true,
    tabBarPosition: 'bottom',
    tabBarOptions: {
      showIcon: true,
      showLabel: false,
      indicatorStyle: {
        backgroundColor: Colors.Pink,
      },
      style: {
        borderTopColor: 'transparent',
        borderTopWidth: 0,
        elevation: 8,
        backgroundColor: 'white',
      },
    },
  },
);

const DrawerStack = createStackNavigator({
  Home: {
    screen: HomeStack,
    navigationOptions: {
      headerShown: false,
    },
  },
  ProfileScreen: {
    screen: ProfileScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: (
        <Button
          style={{
            backgroundColor: Colors.Misty_Rose,
            borderColor: Colors.Misty_Rose,
            elevation: 3,
            padding: 10,
            marginLeft: 15,
          }}
          onPress={() => {
            navigation.goBack();
          }}>
          <Icon style={{ marginRight: 0 }} name="back" />
        </Button>
      ),
      headerTransparent: true,
      headerStyle: {
        backgroundColor: 'transparent',
        elevation: 0,
      },
    }),
  },
});

const AppStack = createDrawerNavigator(
  {
    Main: {
      screen: DrawerStack,
    },
  },
  {
    initialRouteName: 'Main',
    drawerWidth: 300,
    contentComponent: SideMenu,
  },
);

const AuthStack = createStackNavigator(
  {
    LoginScreen: { screen: LoginScreen },
    RegisterScreen: { screen: RegisterScreen },
  },
  {
    headerMode: 'none',
  },
);

const AppContainer = createAppContainer(
  createAnimatedSwitchNavigator(
    {
      LoadingScreen: LoadingScreen,
      App: AppStack,
      Auth: AuthStack,
    },
    {
      initialRouteName: 'LoadingScreen',
      transition: (
        <Transition.Together>
          <Transition.Out
            type="slide-left"
            durationMs={200}
            interpolation="linear"
          />
          <Transition.In type="fade" durationMs={200} />
        </Transition.Together>
      ),
    },
  ),
);

const App = () => {
  return (
    <Screen style={styles.screen}>
      <AppContainer />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  active: {
    color: Colors.Pink,
  },
});

export default App;
