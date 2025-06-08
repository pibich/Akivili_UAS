import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { Headphones } from 'lucide-react-native';
import { supabase } from './Supabase'; // Adjust the import path as needed

const PRIMARY = '#FFA800';

export default function Login({ navigation }) {
  // Use credential (can be email or username)
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    setError('');

    let emailToLogin = credential;

    // If input doesn't look like an email, treat it as a username
    if (!credential.includes('@')) {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('display_name', credential) // change 'display_name' if your username field is named differently
        .maybeSingle();

      if (error || !data) {
        setError('Username/email tidak ditemukan');
        setLoading(false);
        return;
      }
      emailToLogin = data.email;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password,
    });

    setLoading(false);
    if (loginError) setError(loginError.message);
    else navigation.replace('App');
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>Akivili.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CustomerService')}>
          <Headphones size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Login Member</Text>
      <Text style={styles.subtitle}>Masuk menggunakan email atau username yang sudah terdaftar.</Text>

      <TextInput
        style={styles.input}
        placeholder="EMAIL atau USERNAME"
        placeholderTextColor="#999"
        autoCapitalize="none"
        value={credential}
        onChangeText={setCredential}
      />
      <TextInput
        style={styles.input}
        placeholder="PASSWORD"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={{ color: 'red', textAlign: 'center', marginBottom: 12 }}>{error}</Text> : null}

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPass')}>
        <Text style={styles.forgot}>Lupa Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonTxt}>LOGIN</Text>}
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text>Belum punya akun? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Daftar di sini</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 20 },
  header: {
    height: 60,
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  logo:     { fontSize: 24, fontWeight: 'bold', color: '#FFF', flex: 1 },
  title:    { fontSize: 24, fontWeight: '700', marginTop: 24, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 24 },

  input: {
    height: 50,
    backgroundColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 16
  },
  forgot:   { textAlign: 'right', color: PRIMARY, marginBottom: 24 },

  button:   {
    backgroundColor: PRIMARY,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  buttonTxt:{ color: '#000', fontWeight: '700', fontSize: 16 },

  switchRow:{ flexDirection: 'row', justifyContent: 'center' },
  link:     { color: 'red', fontWeight: '600' },
});
