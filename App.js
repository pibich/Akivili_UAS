// App.js
import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Newspaper, ShoppingCart, User } from 'lucide-react-native';

// Screens
import Splash from './user/Splash';
import Login from './user/Login';
import Register from './user/Register';
import CustomerService from './user/CustomerService';

import HomeScreen from './main/Home';
import GameDetail from './main/GameDetail';
import CartScreen from './main/Cart';
import NewsLetter from './main/News';
import Profile from './main/Profile';

// Navigators
const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

// Auth Flow
function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <AuthStack.Screen name="Splash" component={Splash} />
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Register" component={Register} />
    </AuthStack.Navigator>
  );
}

// Home Stack for bottom tabs to persist
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="GameDetail" component={GameDetail} />
    </HomeStack.Navigator>
  );
}

// Tabs with SafeAreaView
function MainTabs() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#FFA800',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            height: 60,
            paddingBottom: 10, // Lebih tinggi agar tidak nabrak gesture bar
            paddingTop: 6,
          },
          tabBarIcon: ({ color, size }) => {
            switch (route.name) {
              case 'Home':
                return <Home color={color} size={size} />;
              case 'Cart':
                return <ShoppingCart color={color} size={size} />;
              case 'News':
                return <Newspaper color={color} size={size} />;
              case 'Profile':
                return <User color={color} size={size} />;
              default:
                return null;
            }
          },
          tabBarLabelStyle: { fontSize: 12 },
        })}
      >
        <Tab.Screen name="Home" component={HomeStackNavigator} />
        <Tab.Screen name="Cart" component={CartScreen} />
        <Tab.Screen name="News" component={NewsLetter} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

// Root App
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Auth">
          <RootStack.Screen name="Auth" component={AuthFlow} />
          <RootStack.Screen name="App" component={MainTabs} />
          <RootStack.Screen name="CustomerService" component={CustomerService} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
