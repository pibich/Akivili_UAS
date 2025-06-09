import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Image, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { Clock, Headphones } from 'lucide-react-native';
import { supabase } from '../user/Supabase';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#FFA800';

type Order = {
  id: string;
  created_at: string;
  game_id: string;
  game_title: string;
  game_picture_url: string | null;
  package_name: string;
  total_amount: number;
  currency: string;
  status: string;
  game_user_id: string;
  payment_method: string | null;
};

export default function HistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          game_user_id,
          total_amount,
          currency,
          payment_method,
          game_id,
          games(title, picture_url),
          topup_packages(package_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = data.map((order: any) => ({
        id: order.id,
        created_at: order.created_at,
        game_id: order.game_id,
        game_title: order.games?.title || 'Unknown Game',
        game_picture_url: order.games?.picture_url || null,
        package_name: order.topup_packages?.package_name || 'Unknown Package',
        total_amount: order.total_amount,
        currency: order.currency,
        status: order.status,
        game_user_id: order.game_user_id,
        payment_method: order.payment_method
      }));

      setOrders(formattedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        {item.game_picture_url ? (
          <Image 
            source={{ uri: item.game_picture_url }} 
            style={styles.gameImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.gameImage, styles.emptyGameImage]}>
            <Clock size={24} color="#999" />
          </View>
        )}
        <View style={styles.orderInfo}>
          <Text style={styles.gameTitle}>{item.game_title}</Text>
          <Text style={styles.packageName}>{item.package_name}</Text>
          <Text style={styles.gameId}>Player ID: {item.game_user_id}</Text>
          {item.payment_method && (
            <Text style={styles.paymentMethod}>Method: {item.payment_method}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.statusContainer}>
          <Text 
            style={[
              styles.statusText,
              item.status === 'COMPLETED' ? styles.statusCompleted : 
              item.status === 'FAILED' ? styles.statusFailed : 
              styles.statusPending
            ]}
          >
            {item.status}
          </Text>
        </View>
        
        <Text style={styles.priceText}>
          {item.currency} {item.total_amount.toLocaleString()}
        </Text>
      </View>
      
      <Text style={styles.dateText}>
        {format(new Date(item.created_at), 'dd MMM yyyy, HH:mm')}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { 
          paddingTop: insets.top,
          height: 60 + insets.top,
        }]}>
          <Text style={styles.logo}>Akivili.</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('CustomerService')}
            style={styles.customerServiceBtn}
          >
            <Headphones size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA800" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { 
          paddingTop: insets.top,
          height: 60 + insets.top,
        }]}>
          <Text style={styles.logo}>Akivili.</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('CustomerService')}
            style={styles.customerServiceBtn}
          >
            <Headphones size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={fetchOrders}>
            Tap to retry
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { 
        paddingTop: insets.top,
        height: 60 + insets.top,
      }]}>
        <Text style={styles.logo}>Akivili.</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('CustomerService')}
          style={styles.customerServiceBtn}
        >
          <Headphones size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={48} color="#999" />
          <Text style={styles.emptyText}>No transaction history yet</Text>
          <Text style={styles.emptySubtext}>Your purchases will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFA800"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  customerServiceBtn: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 80,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  gameImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGameImage: {
    backgroundColor: '#f5f5f5',
  },
  orderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  packageName: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  gameId: {
    fontSize: 13,
    color: '#666',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  statusPending: {
    backgroundColor: '#FFF8E1',
    color: '#FF8F00',
  },
  statusFailed: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  retryText: {
    color: '#FFA800',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#C62828',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});