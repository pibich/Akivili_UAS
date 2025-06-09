import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { supabase } from '../user/Supabase';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

interface TopupPackage {
  id: string;
  package_name: string;
  price: number;
  currency: string;
  description?: string;
  picture_url?: string;
  game_id: string;
}

interface GameDetailRouteParams {
  gameId: string;
}

const PRIMARY = '#FFA800';

export default function GameDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { gameId } = route.params as GameDetailRouteParams;

  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [game, setGame] = useState<{ title: string; picture_url?: string; description?: string }>({ title: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<TopupPackage | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [gameUserId, setGameUserId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [latestOrderId, setLatestOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchGameAndPackages();
  }, [gameId]);

  const fetchGameAndPackages = async () => {
    try {
      setLoading(true);

      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('title, picture_url, description')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData || { title: '' });

      const { data: packagesData, error: packagesError } = await supabase
        .from('topup_packages')
        .select('*')
        .eq('game_id', gameId)
        .eq('is_archived', false)
        .order('price', { ascending: true });

      if (packagesError) throw packagesError;
      setPackages(packagesData || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedPackage || !gameUserId.trim()) {
      Alert.alert('Error', 'Please select a package and enter a UID.');
      return;
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw authError;

      const userId = user.id;

      // Insert order
      const { data: orderData, error: orderError } = await supabase.from('orders').insert([
        {
          user_id: userId,
          game_id: gameId,
          game_user_id: gameUserId.trim(),
          topup_package_id: selectedPackage.id,
          total_amount: selectedPackage.price,
          currency: selectedPackage.currency,
          status: 'PENDING',
        },
      ]).select().single();

      if (orderError) throw orderError;

      setLatestOrderId(orderData.id);
      setModalVisible(true);
      setSelectedPackage(null);
      setGameUserId('');

      // Simulate payment process
      setTimeout(async () => {
        if (orderData.id) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'PAID' })
            .eq('id', orderData.id);
          if (updateError) throw updateError;

          setModalVisible(false);
          Alert.alert('Success', 'Payment successful!');
          navigation.goBack();
        }
      }, 5000); // 5 seconds delay

    } catch (err: any) {
      console.error('Error placing order:', err);
      Alert.alert('Error', err.message || 'Failed to place order');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={fetchGameAndPackages}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginTop: 40, marginLeft: -20 }}>
          <ArrowLeft size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {game.picture_url && (
          <Image source={{ uri: game.picture_url }} style={styles.gameBanner} resizeMode="cover" />
        )}

        <View style={styles.gameInfo}>
          <Text style={styles.header}>{game.title}</Text>
          {game.description && <Text style={styles.gameDescription}>{game.description}</Text>}
        </View>

        <Text style={styles.packagesHeader}>Masukan UID </Text>
        <View style={{ padding: 16, marginTop: -10, marginBottom: -20 }}>
          <TextInput
            style={styles.input}
            placeholder="Masukan UID"
            keyboardType="numeric"
            value={gameUserId}
            onChangeText={setGameUserId}
          />
        </View>

        <Text style={styles.packagesHeader}>Available Packages</Text>

        {packages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No packages available for this game</Text>
          </View>
        ) : (
          packages.map(pkg => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.packageCard, selectedPackage?.id === pkg.id && styles.selectedPackageCard]}
              onPress={() => setSelectedPackage(pkg)}
            >
              <View style={styles.packageImageContainer}>
                {pkg.picture_url ? (
                  <Image source={{ uri: pkg.picture_url }} style={styles.packageImage} resizeMode="cover" />
                ) : (
                  <View style={styles.packageImagePlaceholder}>
                    <Text style={styles.packageImagePlaceholderText}>No Image</Text>
                  </View>
                )}
              </View>
              <View style={styles.packageInfo}>
                <Text style={styles.packageName}>{pkg.package_name}</Text>
                <Text style={styles.packageDescription} numberOfLines={2}>
                  {pkg.description || 'No description available'}
                </Text>
                <Text style={styles.packagePrice}>
                  {pkg.currency} {pkg.price.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {selectedPackage && (
          <View style={{ marginBottom: 10 }}>
            <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
              <Text style={styles.buyNowText}>Beli Sekarang</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Scan QR to Pay</Text>
            <Image
              source={require('../assets/qr.jpg')}
              style={{ width: 300, height: 300 }}
            />
            <Text style={{ marginTop: 10 }}>Waiting for payment...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

  const styles = StyleSheet.create({
 
  buyNowButton: {
    backgroundColor: PRIMARY,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '93%',
    alignSelf: 'center',
    marginTop: 10,
  },

  buyNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryText: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  gameBanner: {
    width: '100%',
    height: 200,
  },
  gameInfo: {
    padding: 16,
    backgroundColor: 'white',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 16,
    color: '#666',
  },
  packagesHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    color: '#333',
    marginTop: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  packageCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  packageImageContainer: {
    width: 100,
    height: 100,
  },
  packageImage: {
    width: '100%',
    height: '100%',
  },
  packageImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPackageCard: {
  borderColor: PRIMARY,
  borderWidth: 2,
  },
  packageImagePlaceholderText: {
    color: '#999',
  },
  packageInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e86de',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e86de',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#2e86de',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  top: {
    marginTop: -10,
    height: 80,
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

input: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 8,
  backgroundColor: '#fff',
  width: '100%',
  alignSelf: 'center',
  height: 40,
},
modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '90%',
  },
  qrImage: {
    width: 150,
    height: 150,
    marginVertical: 10
  }
});