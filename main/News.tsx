import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';

const BASE = 'https://api-berita-indonesia.vercel.app';

type Article = {
  title: string;
  link: string;
  thumbnail: string;
  pubDate: string;
};

const ENDPOINTS = [
  `${BASE}/antara/tekno`,
  `${BASE}/cnn/teknologi`,
  `${BASE}/okezone/techno`,
  `${BASE}/sindonews/tekno`,
  `${BASE}/suara/tekno`,
  `${BASE}/tempo/tekno`,
  `${BASE}/merdeka/teknologi`,
  `${BASE}/antara/hiburan`,
  `${BASE}/cnn/hiburan`,
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function News() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const rawResults = await Promise.all(
          ENDPOINTS.map((url) =>
            axios.get(url)
              .then((r) => r.data)
              .catch((e) => ({ error: e, url }))
          )
        );

        const collected: Article[] = [];

        rawResults.forEach((raw: any) => {
          if (raw && raw.error) {
            console.warn('Failed to fetch:', raw.url, raw.error);
            return;
          }
          const list: any[] =
            raw && raw.data && Array.isArray(raw.data.posts)
              ? raw.data.posts
              : [];

          list.forEach((item: any) => {
            collected.push({
              title: item.judul || item.title || '–',
              link: item.link || item.url || '',
              thumbnail: item.poster || item.thumbnail || item.image || '',
              pubDate:
                item.pubDate ||
                item.waktu ||
                item.date ||
                new Date().toISOString(),
            });
          });
        });

        // Dedupe & sort
        const seen = new Set<string>();
        const deduped = collected
          .filter((a) => a.link && !seen.has(a.link) && seen.add(a.link))
          .sort(
            (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
          );

        setArticles(deduped);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFA800" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }
  if (articles.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>
          Tidak ada berita Teknologi atau Hiburan saat ini.
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(item.link)}>
      {item.thumbnail ? (
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.date}>
          {new Date(item.pubDate).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.link}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const CARD_MARGIN = 12;
const THUMB_WIDTH = SCREEN_WIDTH * 0.3;
const THUMB_HEIGHT = THUMB_WIDTH * 0.75;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  list: {
    padding: CARD_MARGIN,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: CARD_MARGIN,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  empty: {
    color: '#555',
    textAlign: 'center',
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: CARD_MARGIN,
    overflow: 'hidden',
    elevation: 2,
  },
  thumbnail: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#DDD',
  },
  textContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#777',
  },
});