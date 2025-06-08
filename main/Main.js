import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Newspaper, ShoppingCart, User } from 'lucide-react-native';

import HomeScreen from './Home';
import CartScreen from './Cart';
import NewsLetter from './News';
import Profile from './Profile';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FFA800',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { height: 60, paddingBottom: 6, paddingTop: 6 },
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
      <Tab.Screen name="Home"    component={HomeScreen}  options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Cart"    component={CartScreen}  options={{ tabBarLabel: 'Cart' }} />
      <Tab.Screen name="News"    component={NewsLetter} options={{ tabBarLabel: 'News' }} />
      <Tab.Screen name="Profile" component={Profile}     options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
