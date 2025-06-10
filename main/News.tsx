import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Linking,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Headphones } from 'lucide-react-native';
import axios from 'axios';

const NEWS_API_KEY = '6f404f4fe88d4f3395b27591dddf18e1';
const PAGE_SIZE = 20; // NewsAPI default

// Inline AkiviliHeader
function AkiviliHeader({ onRightPress }: { onRightPress: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[headerStyles.header, { paddingTop: insets.top, height: 60 + insets.top }]}>
      <Text style={headerStyles.logo}>Akivili.</Text>
      <TouchableOpacity onPress={onRightPress} style={headerStyles.iconBtn}>
        <Headphones size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

export default function NewsScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchNews = async (_page = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const response = await axios.get(
        `https://newsapi.org/v2/everything?q=("game shop" OR "top up game" OR "game voucher" OR "mobile game" OR "digital wallet" OR "technology" OR "fintech")&language=en&sortBy=popularity&pageSize=${PAGE_SIZE}&page=${_page}&apiKey=${NEWS_API_KEY}`
      );
      const fetched = response.data.articles || [];
      setArticles(prev =>
        isLoadMore ? [...prev, ...fetched] : fetched
      );
      setHasMore(fetched.length === PAGE_SIZE); // If full page, probably has more
    } catch (err) {
      if (!isLoadMore) setArticles([]);
      setHasMore(false);
    }
    if (isLoadMore) setLoadingMore(false);
    else setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    fetchNews(1);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchNews(1).finally(() => setRefreshing(false));
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage, true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => Linking.openURL(item.url)}
      style={styles.cardTouchable}
    >
      <View style={styles.card}>
        {item.urlToImage ? (
          <Card.Cover source={{ uri: item.urlToImage }} style={styles.image} />
        ) : null}
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.date}>{formatDate(item.publishedAt)}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.source}>{item.source?.name || 'News'}</Text>
        </View>
        {item.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <AkiviliHeader onRightPress={() => navigation.navigate('CustomerService')} />
        <View style={[styles.center, { paddingTop: 60 + insets.top }]}>
          <ActivityIndicator size="large" color="#FFA800" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AkiviliHeader onRightPress={() => navigation.navigate('CustomerService')} />
      <FlatList
        data={articles}
        keyExtractor={(item, idx) => item.url + idx}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: 60 + insets.top + 10 }, // Space for header
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>No news found.</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && articles.length > 0 ? (
            <View style={styles.footer}>
              <Button
                mode="contained"
                style={styles.moreBtn}
                onPress={loadMore}
                disabled={loadingMore}
                loading={loadingMore}
                labelStyle={{ color: '#FFA800', fontWeight: 'bold' }}
                contentStyle={{ paddingVertical: 4 }}
                buttonColor="#fff"
              >
                More
              </Button>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  });
}

const PRIMARY = '#FFA800';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  cardTouchable: {
    marginBottom: 18,
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#b6b8bf',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 0,
    marginBottom: 0,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#21243d',
    marginTop: 14,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 3,
  },
  date: {
    fontSize: 12,
    color: '#8b95a1',
  },
  dot: {
    fontSize: 13,
    color: '#bfc8d7',
    marginHorizontal: 5,
  },
  source: {
    fontSize: 12,
    color: '#FFA800',
    fontWeight: '600',
  },
  desc: {
    fontSize: 14,
    color: '#556070',
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 2,
    lineHeight: 19,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  footer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  moreBtn: {
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#FFA800',
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    shadowOpacity: 0,
    elevation: 0,
  },
});

const headerStyles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  iconBtn: {
    padding: 8,
  },
});