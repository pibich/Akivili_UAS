import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  AppState
} from 'react-native';
import { StatusBar } from 'react-native';
import { supabase } from './Supabase';
import * as AuthSession from 'expo-auth-session';

type Props = { navigation: any };

const PRIMARY = '#FFA800';

export default function Signup({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle AppState properly with cleanup
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => subscription.remove();
  }, []);

  const onRegister = async () => {
    if (!email || !password) {
      setError('Email dan password harus diisi');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        native: 'your.app.scheme://auth' // Sesuaikan dengan scheme Anda
      });

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUri,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user?.identities?.length === 0) {
        throw new Error('Email sudah terdaftar');
      }

      Alert.alert(
        'Verifikasi Email', 
        'Cek email Anda untuk verifikasi akun!', 
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );

    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Terjadi kesalahan saat pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.logo}>Akivili.</Text>
      </View>

      <Text style={styles.title}>Register Member</Text>
      <Text style={styles.subtitle}>
        Buat akun baru dengan email dan password
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="EMAIL"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError('');
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="PASSWORD (min. 6 karakter)"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError('');
        }}
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={onRegister} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonTxt}>DAFTAR</Text>
        )}
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text>Sudah punya akun? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Login di sini</Text>
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
    justifyContent: 'center', 
    paddingHorizontal: 16,
    marginBottom: 20
  },
  logo: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    marginTop: 24, 
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: { 
    fontSize: 14, 
    color: '#555', 
    textAlign: 'center', 
    marginBottom: 24 
  },
  input: {
    height: 50, 
    backgroundColor: '#EEE',
    borderRadius: 12, 
    paddingHorizontal: 16,
    fontSize: 14, 
    marginBottom: 16
  },
  button: {
    backgroundColor: PRIMARY, 
    height: 50,
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center', 
    marginBottom: 24
  },  
  buttonTxt: { 
    color: '#000', 
    fontWeight: '700', 
    fontSize: 16 
  },
  switchRow: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    marginTop: 12
  },
  link: { 
    color: PRIMARY, 
    fontWeight: '600' 
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16
  }
});