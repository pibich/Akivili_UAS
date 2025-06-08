// App.js
import React from 'react';
import { NavigationContainer }     from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabs   from './main/Main';      // Tab navigator utama
import UserMain   from './user/UserMain';  // Flow auth (splash, login, dll.)
import CustomerService from './user/CustomerService';

const RootStack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Auth">
        <RootStack.Screen name="App" component={MainTabs} />
        <RootStack.Screen name="Auth" component={UserMain} />
        <RootStack.Screen name="CustomerService" component={CustomerService} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}