// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   ScrollView,
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { supabase } from '../user/Supabase';
// import { Headphones } from 'lucide-react-native';

// const PRIMARY = '#FFA800';
// const BORDER = '#FFCD5C';

// export default function Profile({ navigation }) {
//   const insets = useSafeAreaInsets();
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('********');
//   const [isEditingEmail, setIsEditingEmail] = useState(false);
//   const [isEditingPassword, setIsEditingPassword] = useState(false);
//   const [secureEntry, setSecureEntry] = useState(true);

//   useEffect(() => {
//     const getUser = async () => {
//       const { data: { session }, error } = await supabase.auth.getSession();
//       if (error) {
//         Alert.alert('Error', error.message);
//         setLoading(false);
//         return;
//       }
//       setUser(session?.user ?? null);
//       setEmail(session?.user?.email ?? '');
//       setLoading(false);
//     };
//     getUser();
//   }, []);

//   useEffect(() => {
//     if (user?.id) {
//       supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', user.id)
//         .single()
//         .then(({ data, error }) => {
//           if (data) setProfile(data);
//         });
//     }
//   }, [user]);

//   const onLogout = async () => {
//     await supabase.auth.signOut();
//     navigation.getParent()?.replace('Auth');
//   };

//   const handleUpdateEmail = async () => {
//     if (!email) {
//         Alert.alert('Error', 'Email tidak boleh kosong');
//         return;
//     }

//     if (email === user?.email) {
//         setIsEditingEmail(false);
//         return;
//     }

//     try {
//         setLoading(true);
        
//         // Langsung update email tanpa verifikasi
//         const { data, error } = await supabase.auth.updateUser({ 
//         email,
//         }, {
//         emailRedirectTo: 'akivili://profile', // Opsional: deep link untuk redirect
//         });

//         if (error) throw error;

//         // Update email di tabel `profiles` (jika diperlukan)
//         const { error: profileError } = await supabase
//         .from('profiles')
//         .update({ email })
//         .eq('id', user.id);

//         if (profileError) throw profileError;

//         Alert.alert('Berhasil', 'Email berhasil diubah!', [
//         { 
//             text: 'OK', 
//             onPress: () => {
//             setIsEditingEmail(false);
//             setUser(prev => ({ ...prev, email }));
//             }
//         }
//         ]);
//     } catch (error) {
//         Alert.alert('Error', error.message);
//         setEmail(user?.email || '');
//     } finally {
//         setLoading(false);
//     }
//     };

//   const handleUpdatePassword = async () => {
//     if (!password || password === '********') {
//       Alert.alert('Error', 'Password tidak boleh kosong');
//       return;
//     }

//     try {
//       const { error } = await supabase.auth.updateUser({ password });
//       if (error) throw error;
      
//       Alert.alert('Berhasil', 'Password berhasil diubah!');
//       setPassword('********');
//       setIsEditingPassword(false);
//     } catch (error) {
//       Alert.alert('Error', error.message);
//       setPassword('********');
//     }
//   };

//   if (loading) {
//     return (
//       <View style={[styles.container, { paddingBottom: insets.bottom }]}>
//         <ActivityIndicator size="large" color={PRIMARY} />
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       behavior="padding"
//       style={styles.container}
//     >
//       <ScrollView
//         contentContainerStyle={[
//           styles.scrollContainer,
//           { paddingBottom: insets.bottom + 20 }
//         ]}
//         keyboardShouldPersistTaps="handled"
//       >
//         {/* Header */}
//         <View style={[styles.header, { paddingTop: insets.top }]}>
//           <Text style={styles.logo}>Akivili.</Text>
//           <View style={styles.headerRight}>
//             <TouchableOpacity 
//               onPress={() => navigation.navigate('CustomerService')}
//               style={styles.customerServiceBtn}
//             >
//               <Headphones size={24} color="#FFF" />
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
//               <Text style={styles.logoutTxt}>Logout</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Profile Content */}
//         <View style={styles.content}>
//           {/* Avatar Section */}
//           <View style={styles.avatarSection}>
//             <View style={styles.avatarWrapper}>
//               <Image
//                 source={require('../assets/user-icon.png')}
//                 style={styles.avatar}
//               />
//             </View>
//             <Text style={styles.greeting}>
//               Halo, <Text style={styles.username}>{profile?.display_name || user?.email?.split('@')[0] || 'User'}!</Text>
//             </Text>
//             <Text style={styles.subtitle}>
//               Ingat, lebih baik mengelola keuangan dengan bijak daripada menyesal di kemudian hari.
//             </Text>
//           </View>

//           {/* Form Section */}
//           <View style={styles.formSection}>
//             <Text style={styles.sectionTitle}>Informasi Akun</Text>

//             {/* Email Field */}
//             <View style={styles.inputContainer}>
//               <Text style={styles.label}>Email</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Email"
//                 placeholderTextColor="#999"
//                 value={email}
//                 onChangeText={setEmail}
//                 editable={isEditingEmail}
//                 autoCapitalize="none"
//                 keyboardType="email-address"
//               />
//               <TouchableOpacity
//                 style={styles.changeButton}
//                 onPress={isEditingEmail ? handleUpdateEmail : () => setIsEditingEmail(true)}
//               >
//                 <Text style={styles.changeButtonText}>
//                   {isEditingEmail ? 'Simpan' : 'Ubah'}
//                 </Text>
//               </TouchableOpacity>
//               {isEditingEmail && (
//                 <TouchableOpacity
//                   style={[styles.changeButton, styles.cancelButton]}
//                   onPress={() => {
//                     setIsEditingEmail(false);
//                     setEmail(user?.email || '');
//                   }}
//                 >
//                   <Text style={styles.changeButtonText}>Batal</Text>
//                 </TouchableOpacity>
//               )}
//             </View>

//             {/* Password Field */}
//             <View style={styles.inputContainer}>
//               <Text style={styles.label}>Password</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Password"
//                 placeholderTextColor="#999"
//                 value={password}
//                 onChangeText={setPassword}
//                 editable={isEditingPassword}
//                 secureTextEntry={!isEditingPassword ? secureEntry : false}
//               />
//               <TouchableOpacity
//                 style={styles.eyeIcon}
//                 onPress={() => setSecureEntry(!secureEntry)}
//               >
//                 <Text style={styles.eyeIconText}>
//                   {secureEntry ? 'Tampilkan' : 'Sembunyikan'}
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.changeButton}
//                 onPress={isEditingPassword ? handleUpdatePassword : () => setIsEditingPassword(true)}
//               >
//                 <Text style={styles.changeButtonText}>
//                   {isEditingPassword ? 'Simpan' : 'Ubah'}
//                 </Text>
//               </TouchableOpacity>
//               {isEditingPassword && (
//                 <TouchableOpacity
//                   style={[styles.changeButton, styles.cancelButton]}
//                   onPress={() => {
//                     setIsEditingPassword(false);
//                     setPassword('********');
//                     setSecureEntry(true);
//                   }}
//                 >
//                   <Text style={styles.changeButtonText}>Batal</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFF',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//   },
//   header: {
//     height: 60,
//     backgroundColor: PRIMARY,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   logo: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#FFF',
//   },
//   customerServiceBtn: {
//     padding: 8,
//     marginRight: 12,
//   },
//   logoutBtn: {
//     backgroundColor: '#FFF',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//   },
//   logoutTxt: {
//     color: PRIMARY,
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   content: {
//     padding: 20,
//   },
//   avatarSection: {
//     alignItems: 'center',
//     marginBottom: 32,
//   },
//   avatarWrapper: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: '#FAFAFA',
//     borderWidth: 1,
//     borderColor: BORDER,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   avatar: {
//     width: 60,
//     height: 60,
//     tintColor: PRIMARY,
//   },
//   greeting: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#000',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   username: {
//     color: PRIMARY,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#555',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   formSection: {
//     marginTop: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#000',
//     marginBottom: 24,
//   },
//   inputContainer: {
//     marginBottom: 24,
//     position: 'relative',
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#555',
//     marginBottom: 8,
//   },
//   input: {
//     height: 50,
//     backgroundColor: '#FAFAFA',
//     borderWidth: 1,
//     borderColor: BORDER,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     fontSize: 14,
//     color: '#000',
//     paddingRight: 120,
//   },
//   eyeIcon: {
//     position: 'absolute',
//     right: 16,
//     top: 40,
//   },
//   eyeIconText: {
//     color: PRIMARY,
//     fontWeight: '600',
//     fontSize: 12,
//   },
//   changeButton: {
//     position: 'absolute',
//     right: 16,
//     top: 40,
//     backgroundColor: PRIMARY,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//   },
//   cancelButton: {
//     right: 90,
//     backgroundColor: '#FF3B30',
//   },
//   changeButtonText: {
//     color: '#000',
//     fontWeight: '600',
//     fontSize: 12,
//   },
// });

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../user/Supabase';
import { Headphones } from 'lucide-react-native';

const PRIMARY = '#FFA800';
const BORDER = '#FFCD5C';

export default function Profile({ navigation }) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('********');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      setEmail(session?.user?.email ?? '');
      setLoading(false);
    };
    getUser();
  }, []);

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

  const handleUpdatePassword = async () => {
    if (!password || password === '********') {
      Alert.alert('Error', 'Password tidak boleh kosong');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      Alert.alert('Berhasil', 'Password berhasil diubah!');
      setPassword('********');
      setIsEditingPassword(false);
    } catch (error) {
      Alert.alert('Error', error.message);
      setPassword('********');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
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
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('CustomerService')}
              style={styles.customerServiceBtn}
            >
              <Headphones size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={styles.logoutTxt}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Content */}
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={require('../assets/user-icon.png')}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.greeting}>
              Halo, <Text style={styles.username}>{profile?.display_name || user?.email?.split('@')[0] || 'User'}!</Text>
            </Text>
            <Text style={styles.subtitle}>
              Ingat, lebih baik mengelola keuangan dengan bijak daripada menyesal di kemudian hari.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Informasi Akun</Text>

            {/* Email Field - Disabled for editing */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#EEE', color: '#666' }]}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                editable={false}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Text style={styles.disabledText}>Email tidak dapat diubah</Text>
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                editable={isEditingPassword}
                secureTextEntry={!isEditingPassword ? secureEntry : false}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setSecureEntry(!secureEntry)}
              >
                <Text style={styles.eyeIconText}>
                  {secureEntry ? 'Tampilkan' : 'Sembunyikan'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={isEditingPassword ? handleUpdatePassword : () => setIsEditingPassword(true)}
              >
                <Text style={styles.changeButtonText}>
                  {isEditingPassword ? 'Simpan' : 'Ubah'}
                </Text>
              </TouchableOpacity>
              {isEditingPassword && (
                <TouchableOpacity
                  style={[styles.changeButton, styles.cancelButton]}
                  onPress={() => {
                    setIsEditingPassword(false);
                    setPassword('********');
                    setSecureEntry(true);
                  }}
                >
                  <Text style={styles.changeButtonText}>Batal</Text>
                </TouchableOpacity>
              )}
            </View>
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
    height: 60,
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  customerServiceBtn: {
    padding: 8,
    marginRight: 12,
  },
  logoutBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  logoutTxt: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    tintColor: PRIMARY,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  username: {
    color: PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
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
    paddingRight: 120,
  },
  disabledText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 40,
  },
  eyeIconText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 12,
  },
  changeButton: {
    position: 'absolute',
    right: 16,
    top: 40,
    backgroundColor: PRIMARY,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelButton: {
    right: 90,
    backgroundColor: '#FF3B30',
  },
  changeButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
});