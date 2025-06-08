// src/user/UserMain.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Splash          from './Splash';
import Login           from './Login';
import Register          from './Register';
import CustomerService from './CustomerService';

const Stack = createNativeStackNavigator();

export default function UserMain() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="CustomerService" component={CustomerService} />
    </Stack.Navigator>
  );
}
