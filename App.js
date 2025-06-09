import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Newspaper, Clock, User } from 'lucide-react-native';

// Screens
import Splash from './user/Splash';
import Login from './user/Login';
import Register from './user/Register';
import CustomerService from './user/CustomerService';
import HomeScreen from './main/Home';
import GameDetail from './main/GameDetail';
import HistoryScreen from './main/History';
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
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade',
      }} 
      initialRouteName="Splash"
    >
      <AuthStack.Screen name="Splash" component={Splash} />
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Register" component={Register} />
    </AuthStack.Navigator>
  );
}

// Home Stack
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="GameDetail" component={GameDetail} />
    </HomeStack.Navigator>
  );
}

// Main Tabs
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FFA800',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 6,
          borderTopWidth: 0,
          elevation: 8,
        },
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'Home': return <Home color={color} size={size} />;
            case 'History': return <Clock color={color} size={size} />;
            case 'News': return <Newspaper color={color} size={size} />;
            case 'Profile': return <User color={color} size={size} />;
            default: return null;
          }
        },
        tabBarLabelStyle: { 
          fontSize: 12,
          marginBottom: 4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="News" component={NewsLetter} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

// Root App
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator 
          screenOptions={{ 
            headerShown: false,
          }} 
          initialRouteName="Auth"
        >
          <RootStack.Screen 
            name="Auth" 
            component={AuthFlow} 
            options={{ animation: 'fade' }} 
          />
          <RootStack.Screen 
            name="App" 
            component={MainTabs} 
            options={{ animation: 'fade' }} 
          />
          
          {/* Global modals - accessible from anywhere */}
          <RootStack.Group screenOptions={{ presentation: 'modal' }}>
            <RootStack.Screen 
              name="CustomerService" 
              component={CustomerService}
              options={{ 
                animation: 'slide_from_bottom',
                gestureEnabled: true,
              }} 
            />
          </RootStack.Group>
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}