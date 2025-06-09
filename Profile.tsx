import React, { useEffect, useState } from 'react';
import {  View, Text, Image,  TextInput,  TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform,
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
        .select('*') 
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
      console.log('Loading avatar, profile:', profile);
      
      if (!profile?.avatar_url) {
        console.log('No avatar URL found');
        setAvatarUri(null);
        return;
      }

      try {
        if (profile.avatar_url.startsWith('http')) {
          const newUri = `${profile.avatar_url}?t=${Date.now()}`;
          console.log('Setting avatar URI:', newUri);
          setAvatarUri(newUri);
          return;
        }

        const path = profile.avatar_url.split('/avatars/')[1];
        if (!path) {
          console.log('No valid path found');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);

        const finalUri = `${publicUrl}?t=${Date.now()}`;
        console.log('Setting avatar URI from path:', finalUri);
        setAvatarUri(finalUri);
      } catch (error) {
        console.log('Error loading avatar:', error);
        setAvatarUri(null);
      }
    };

    loadAvatar();
  }, [profile?.avatar_url, profile?.updated_at]); 

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
      console.log('Starting upload for URI:', uri);
      
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log('Uploading to path:', filePath);

      if (profile?.avatar_url) {
        try {
          const oldPath = profile.avatar_url.split('/avatars/')[1];
          if (oldPath) {
            console.log('Removing old avatar:', oldPath);
            await supabase.storage.from('avatars').remove([oldPath]);
          }
        } catch (deleteError) {
          console.log('Error deleting old avatar:', deleteError);
        }
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('Could not generate image URL');
      
      console.log('Generated public URL:', publicUrl);

      const now = new Date().toISOString();

      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: now
        })
        .eq('id', user.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log('Database updated successfully:', updateData);

      setProfile(updateData);
      
      const newAvatarUri = `${publicUrl}?t=${Date.now()}`;
      setAvatarUri(newAvatarUri);
      
      console.log('Avatar URI set to:', newAvatarUri);

      Alert.alert('Berhasil', 'Foto profil berhasil diperbarui!');

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
      <View style={[styles.loadingContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
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

      {/* Scrollable Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
                    }}
                    style={styles.avatarImage}
                    onLoad={() => console.log('Avatar image loaded successfully')}
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
                {/* Debug info - remove in production */}
                {__DEV__ && (
                  <View style={styles.debugInfo}>
                    <Text style={styles.debugText}>
                      Avatar: {avatarUri ? 'Yes' : 'No'}
                    </Text>
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
                  style={[styles.input, styles.disabledInput]}
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
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    editable={isEditingPassword}
                    secureTextEntry={!isEditingPassword ? secureEntry : false}
                  />
                  <View style={styles.passwordActions}>
                    {!isEditingPassword && (
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setSecureEntry(!secureEntry)}
                      >
                        <Text style={styles.eyeButtonText}>
                          {secureEntry ? 'Show' : 'Hide'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryButton]}
                      onPress={isEditingPassword ? handleUpdatePassword : () => setIsEditingPassword(true)}
                    >
                      <Text style={styles.actionButtonText}>
                        {isEditingPassword ? 'Simpan' : 'Ubah'}
                      </Text>
                    </TouchableOpacity>
                    {isEditingPassword && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => {
                          setIsEditingPassword(false);
                          setPassword('********');
                          setSecureEntry(true);
                        }}
                      >
                        <Text style={styles.actionButtonText}>Batal</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 80, 
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
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
    borderRadius: 50,
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
    maxWidth: '90%',
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
  },
  disabledInput: {
    backgroundColor: '#EEE',
    color: '#666',
  },
  disabledText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 16,
  },
  passwordActions: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  eyeButtonText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 12,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  debugInfo: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
  },
});