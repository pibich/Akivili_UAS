// src/main/Profile.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../user/Supabase'; // Adjust the import path as needed

const PRIMARY = '#FFA800';
const BORDER = '#FFCD5C';

export default function Profile({ navigation }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch user from Supabase session
  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getUser();
  }, []);

  // 2. Fetch username/profile from "profiles" table (if available)
  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigation.getParent()?.replace('Auth');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Akivili.</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutTxt}>Logout →</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar & Greeting */}
      <View style={styles.profile}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Image
              source={require('../assets/user-icon.png')}
              style={styles.avatarIcon}
            />
          </View>
        </View>
        <Text style={styles.greeting}>
          Hello, <Text style={styles.username}>{profile?.display_name || user?.email?.split('@')[0] || 'User'}!</Text>
        </Text>
        <Text style={styles.subtitle}>
          Ingat, lebih baik mengelola keuangan dengan bijak daripada menyesal di kemudian hari.
        </Text>
      </View>

      {/* Form Email & Username */}
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={user?.email || ''} editable={false} />
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Username</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={profile?.display_name || user?.email?.split('@')[0] || ''}
            editable={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo:      { fontSize: 24, fontWeight: 'bold', color: '#000' },
  logoutBtn: { backgroundColor: '#FFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  logoutTxt: { color: PRIMARY, fontWeight: '600' },

  profile:        { alignItems: 'center', marginTop: 24, paddingHorizontal: 20 },
  avatarWrapper:  { marginBottom: 16 },
  avatarCircle:   {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 4, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center'
  },
  avatarIcon: { width: 50, height: 50, tintColor: '#000' },

  greeting:  { fontSize: 20, fontWeight: '600' },
  username:  { color: PRIMARY },
  subtitle:  {
    textAlign: 'center', color: '#555',
    marginTop: 8, paddingHorizontal: 20, fontSize: 14
  },

  form:    { marginTop: 32, paddingHorizontal: 20 },
  label:   { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  inputRow:{ flexDirection: 'row', alignItems: 'center' },
  input:   {
    flex: 1, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 100, paddingVertical: 10,
    paddingHorizontal: 16, fontSize: 14, marginRight: 12
  },
  changeBtn:{ backgroundColor: PRIMARY, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100 },
  changeTxt:{ color: '#000', fontWeight: '600', fontSize: 14 },
});
