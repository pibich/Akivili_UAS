import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  ScrollView,
  Button, 
  Alert
} from 'react-native';
import { supabase } from '../user/Supabase';
import { useNavigation, useRoute } from '@react-navigation/native';

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

export default function GameDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { gameId } = route.params as GameDetailRouteParams;
  
  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [game, setGame] = useState<{title: string, picture_url?: string, description?: string}>({title: ''});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<TopupPackage | null>(null);
  const [quantity, setQuantity] = useState(1);

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
      setGame(gameData || {title: ''});

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

  const handleAddToCart = async () => {
  if (!selectedPackage) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    let { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cartError && cartError.code !== 'PGRST116') throw cartError;
    
    if (!cartData) {
      const { data: newCartData, error: newCartError } = await supabase
        .from('carts')
        .insert([{ user_id: userId }])
        .select()
        .single();
    
      if (newCartError) throw newCartError;
      cartData = newCartData;
    }

    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartData.id)
      .eq('topup_package_id', selectedPackage.id)
      .maybeSingle();

    if (existingItemError) throw existingItemError;

    if (existingItem) {
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert([{
          cart_id: cartData.id,
          topup_package_id: selectedPackage.id,
          quantity: quantity
        }]);

      if (insertError) throw insertError;
    }

    setSelectedPackage(null);
    setQuantity(1);
    Alert.alert('Success', 'Item added to cart!');
    
  } catch (err: any) {
    console.error('Error adding to cart:', err);
    Alert.alert('Error', err.message || 'Failed to add item to cart');
  }
};

  const renderPackageItem = ({ item }: { item: TopupPackage }) => (
    <TouchableOpacity 
      style={styles.packageCard}
      onPress={() => setSelectedPackage(item)}
    >
      <View style={styles.packageImageContainer}>
        {item.picture_url ? (
          <Image 
            source={{ uri: item.picture_url }} 
            style={styles.packageImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.packageImagePlaceholder}>
            <Text style={styles.packageImagePlaceholderText}>No Image</Text>
          </View>
        )}
      </View>
      <View style={styles.packageInfo}>
        <Text style={styles.packageName}>{item.package_name}</Text>
        <Text style={styles.packageDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        <Text style={styles.packagePrice}>
          {item.currency} {item.price.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
      {game.picture_url && (
        <Image 
          source={{ uri: game.picture_url }} 
          style={styles.gameBanner}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.gameInfo}>
        <Text style={styles.header}>{game.title}</Text>
        {game.description && (
          <Text style={styles.gameDescription}>{game.description}</Text>
        )}
      </View>
      
      <Text style={styles.packagesHeader}>Available Packages</Text>
      
      <FlatList
        data={packages}
        renderItem={renderPackageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No packages available for this game</Text>
          </View>
        }
      />

      {/* Package Detail Modal */}
      <Modal
        visible={!!selectedPackage}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedPackage(null)}
      >
        {selectedPackage && (
          <ScrollView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPackage.package_name}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedPackage(null)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            {selectedPackage.picture_url ? (
              <Image 
                source={{ uri: selectedPackage.picture_url }} 
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.modalImagePlaceholder}>
                <Text style={styles.modalImagePlaceholderText}>No Image Available</Text>
              </View>
            )}
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.modalText}>
                {selectedPackage.description || 'No description available'}
              </Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Price</Text>
              <Text style={styles.priceText}>
                {selectedPackage.currency} {selectedPackage.price.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={handleAddToCart}
            >
              <Text style={styles.addToCartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'white',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: '#666',
  },
  modalImage: {
    width: '100%',
    height: 250,
    marginVertical: 16,
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  modalImagePlaceholderText: {
    color: '#999',
    fontSize: 16,
  },
  modalSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
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
});