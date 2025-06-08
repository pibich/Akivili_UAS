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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

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
  const [uploading, setUploading] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);

  const ensureProfileExists = async (userId, userEmail) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            display_name: userEmail.split('@')[0],
            created_at: new Date().toISOString()
          }]);
        
        if (insertError) throw insertError;
        
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        return newProfile;
      }
      
      return data;
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (!session?.user) {
          setLoading(false);
          navigation.getParent()?.replace('Auth');
          return;
        }
        
        setUser(session.user);
        setEmail(session.user.email);
        
        const profile = await ensureProfileExists(session.user.id, session.user.email);
        
        if (!profile) {
          throw new Error('Profile not found after creation');
        }
        
        setProfile(profile);
      } catch (error) {
        console.error('Failed to load user data:', error);
        Alert.alert('Error', 'Failed to load user data');
        navigation.getParent()?.replace('Auth');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  useEffect(() => {
    const loadAvatar = async () => {
      if (!profile?.avatar_url) {
        setAvatarUri(null);
        return;
      }

      try {
        // Extract path after 'avatars/' (e.g., 'user-id/filename.jpg')
        const path = profile.avatar_url.split('/avatars/')[1];
        if (!path) return;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);

        // Verify the file exists
        const { error: listError } = await supabase.storage
          .from('avatars')
          .list(path.split('/')[0]);

        if (listError) throw listError;

        // Add cache busting parameter
        setAvatarUri(`${publicUrl}?t=${Date.now()}`);
      } catch (error) {
        console.log('Error loading avatar:', error);
        setAvatarUri(null);
      }
    };

    loadAvatar();
  }, [profile?.avatar_url]);

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.getParent()?.replace('Auth');
    } catch (error) {
      Alert.alert('Error', 'Gagal logout: ' + error.message);
    }
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
      setSecureEntry(true);
    } catch (error) {
      Alert.alert('Error', error.message);
      setPassword('********');
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Izin diperlukan', 'Kami membutuhkan akses ke galeri untuk memilih foto');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih gambar: ' + error.message);
      console.error(error);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Izin diperlukan', 'Kami membutuhkan akses kamera untuk mengambil foto');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil foto: ' + error.message);
      console.error(error);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) return;
    
    try {
      setUploading(true);
      
      // Read the image file
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('Could not generate image URL');

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh profile data
      const { data: newProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;
      setProfile(newProfile);

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Error',
        error.message || 'Failed to upload image. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Pilih Foto Profil',
      'Dari mana Anda ingin mengambil foto profil?',
      [
        {
          text: 'Ambil Foto',
          onPress: takePhoto,
        },
        {
          text: 'Pilih dari Galeri',
          onPress: pickImage,
        },
        {
          text: 'Batal',
          style: 'cancel',
        },
      ]
    );
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

        <View style={styles.content}>
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={styles.avatarWrapper} 
              onPress={showImagePickerOptions}
              disabled={uploading}
            >
              {avatarUri ? (
                <Image
                  source={{ 
                    uri: avatarUri,
                    cache: 'reload'
                  }}
                  style={styles.avatarImage}
                  onError={(e) => {
                    console.log('Image load error:', e.nativeEvent.error);
                    setAvatarUri(null);
                  }}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Image
                    source={require('../assets/user-icon.png')}
                    style={styles.avatarIcon}
                  />
                </View>
              )}
              {uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.uploadingText}>Mengupload...</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.greeting}>
              Halo, <Text style={styles.username}>{profile?.display_name || user?.email?.split('@')[0] || 'User'}!</Text>
            </Text>
            <Text style={styles.subtitle}>
              Ingat, lebih baik mengelola keuangan dengan bijak daripada menyesal di kemudian hari.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Informasi Akun</Text>

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
              {!isEditingPassword && (
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setSecureEntry(!secureEntry)}
                >
                  <Text style={styles.eyeIconText}>
                    {secureEntry ? 'Tampilkan' : 'Sembunyikan'}
                  </Text>
                </TouchableOpacity>
              )}
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
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  avatarIcon: {
    width: 60,
    height: 60,
    tintColor: PRIMARY,
  },
  uploadOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  uploadingText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
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
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
});