// Home.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import { supabase } from '../user/Supabase';
import { Headphones } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#FFA800';
const BORDER = '#FFCD5C';

interface Game {
  id: string;
  title: string;
  description: string;
  picture_url: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH;
const BANNER_HEIGHT = 300;

const bannerImages = [
  'https://www.creativeuncut.com/gallery-39/art/gi-promo-art.jpg',
  'https://webstatic.hoyoverse.com/upload/op-public/2022/02/08/eb228c7d178a684934d3cbb9189e5fb0_8364089112069254680.jpeg?x-oss-process=image/resize,w_750/quality,q_80',
  'https://play.mobilelegends.com/events/mlbbxwhatsapp/mlbbweb/img/nextBanner_3.b9a29f3.jpg',
  'https://cdn.oneesports.id/cdn-data/sites/2/2024/11/MCGG_Cover-1.jpg',
  'https://blog.prydwen.gg/wp-content/uploads/2023/05/blog_newbann.jpg',
];

export default function Home({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const bannerRef = useRef<ScrollView>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndexRef.current + 1) % bannerImages.length;
      if (bannerRef.current) {
        bannerRef.current.scrollTo({
          x: nextIndex * BANNER_WIDTH,
          animated: true,
        });
      }
      currentIndexRef.current = nextIndex;
      setCurrentBannerIndex(nextIndex);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGames(data || []);
      setFilteredGames(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = games.filter((game) =>
      game.title.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredGames(filtered);
  };

  const renderGameItem = ({ item }: { item: Game }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
    >
      {item.picture_url && (
        <Image
          source={{ uri: item.picture_url }}
          style={styles.gameImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.gameInfo}>
        <Text style={styles.gameTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.gameDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const onBannerScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / BANNER_WIDTH);
    currentIndexRef.current = newIndex;
    setCurrentBannerIndex(newIndex);
  };

  const renderBanner = () => (
    <ScrollView
      ref={bannerRef}
      horizontal
      pagingEnabled
      snapToInterval={BANNER_WIDTH}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={onBannerScrollEnd}
    >
      {bannerImages.map((url, index) => (
        <View key={index} style={{ width: BANNER_WIDTH }}>
          <Image
            source={{ uri: url }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>
      ))}
    </ScrollView>
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
        <TouchableOpacity onPress={fetchGames}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

      <TextInput
        style={styles.searchInput}
        placeholder="Search games..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filteredGames}
        renderItem={renderGameItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.rowWrapper}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            {renderBanner()}
            <View style={styles.bannerBoxesWrapper}>
              {bannerImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.bannerBox,
                    currentBannerIndex === index && styles.bannerBoxActive,
                  ]}
                />
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No games found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
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
  header: {
    marginTop: -20,
    height: 80,
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  searchInput: {
    height: 40,
    marginTop: 20,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    fontSize: 16,
    elevation: 2,
  },
  bannerImage: {
    width: '100%',
    height: BANNER_HEIGHT,
    borderRadius: 5,
  },
  bannerBoxesWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  bannerBox: {
    width: 20,
    height: 3,
    backgroundColor: '#ccc',
    marginHorizontal: 6,
    marginTop: -10,
    borderRadius: 2,
  },
  bannerBoxActive: {
    backgroundColor: '#333',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  rowWrapper: {
    justifyContent: 'space-between',
  },
  gameCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    flex: 0.48,
    overflow: 'hidden',
    elevation: 3,
  },
  customerServiceBtn: {
    padding: 8,
  },
  gameImage: {
    width: '100%',
    height: 120,
  },
  gameInfo: {
    padding: 10,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  gameDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
});