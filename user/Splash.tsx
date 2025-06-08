// src/user/Splash.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { supabase } from './Supabase'; // Pastikan path ini sesuai dengan file Supabase Anda

const PRIMARY = '#FFA800';

export default function Splash({ navigation }) {
  useEffect(() => {
    // Hanya pakai listener
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        navigation.replace('App');
      } else {
        navigation.replace('Login');
      }
    });

    // Supabase: check current session only via listener
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PRIMARY} />
      <Text style={styles.logo}>Akivili.</Text>
      <ActivityIndicator color="#FFF" style={{ marginTop: 24 }} />
      <Text style={styles.tagline}>
        Tempat Top-up Game yang Aman, Tercepat, dan Terpercaya.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  logo:    { fontSize: 48, fontWeight: '900', color: '#FFF', marginBottom: 12 },
  tagline: { fontSize: 16, color: '#FFF', textAlign: 'center' },
});

