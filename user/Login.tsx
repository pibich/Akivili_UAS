//Login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Headphones } from 'lucide-react-native';
import { supabase } from './Supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#FFA800';
const BORDER = '#FFCD5C';

export default function Login({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);

  React.useEffect(() => {
    if (route.params?.successMessage) {
      Alert.alert('Sukses', route.params.successMessage);
      navigation.setParams({ successMessage: undefined });
    }
  }, [route.params]);

  const onLogin = async () => {
    if (!credential || !password) {
      setError('Email/username dan password harus diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let emailToLogin = credential;

      if (!credential.includes('@')) {
        const { data, error: usernameError } = await supabase
          .from('profiles')
          .select('email')
          .eq('display_name', credential)
          .maybeSingle();

        if (usernameError || !data) {
          throw new Error('Username/email tidak ditemukan');
        }
        emailToLogin = data.email;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password,
      });

      if (loginError) throw loginError;
      
      navigation.replace('App');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + 20 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.logo}>Akivili.</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('CustomerService')}
            style={styles.customerServiceBtn}
          >
            <Headphones size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Login Member</Text>
          <Text style={styles.subtitle}>
            Masuk menggunakan email yang sudah terdaftar
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={credential}
              onChangeText={(text) => {
                setCredential(text);
                setError('');
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={secureEntry}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setSecureEntry(!secureEntry)}
            >
              <Text style={styles.eyeIconText}>
                {secureEntry ? 'Tampilkan' : 'Sembunyikan'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => navigation.navigate('ForgotPass')}
          >
            <Text style={styles.forgotText}>Lupa Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>LOGIN</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Daftar di sini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    height: 80,
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  customerServiceBtn: {
    padding: 8,
  },
  formContainer: {
    padding: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    height: 50,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#000',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 13,
  },
  eyeIconText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 12,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: PRIMARY,
    fontWeight: '600',
  },
  button: {
    backgroundColor: PRIMARY,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerText: {
    color: '#555',
  },
  footerLink: {
    color: PRIMARY,
    fontWeight: '600',
  },
});