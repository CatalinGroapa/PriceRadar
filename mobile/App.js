import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { API_BASE_URL } from './src/config';

const WISHLIST_STORAGE_KEY = 'smartshop_mobile_wishlist';

const sortModes = {
  relevance: 'Relevance',
  priceAsc: 'Price: Low to High',
  priceDesc: 'Price: High to Low',
};

const queryStopWords = new Set([
  'de',
  'la',
  'si',
  'sau',
  'cu',
  'the',
  'for',
  'gb',
  'inch',
  'in',
]);

function normalizeProduct(product) {
  const originalImage = product.image || '';
  const proxiedImage = originalImage
    ? `${API_BASE_URL}/image-proxy?url=${encodeURIComponent(originalImage)}`
    : '';

  return {
    id: String(product.id || `${product.store}-${product.title}`),
    title: product.title || 'Untitled',
    price: Number(product.price || 0),
    store: product.store || 'Unknown',
    image: proxiedImage,
    imageOriginal: originalImage,
    productUrl: product.productUrl || product.storeUrl || '',
    rating: Number(product.rating || 0),
    inStock: Boolean(product.inStock),
    recommendationScore: Number(product.recommendationScore || 0),
  };
}

function formatPrice(value) {
  return `${Math.round(value).toLocaleString('en-US')} MDL`;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getQueryTokens(query) {
  return normalizeText(query)
    .split(' ')
    .filter((token) => token.length > 1 && !queryStopWords.has(token));
}

function isStrictRelevantMatch(product, query) {
  const title = normalizeText(product.title);
  const tokens = getQueryTokens(query);

  if (!tokens.length) return true;

  // For explicit model queries (e.g. "iphone 13"), require all important tokens.
  return tokens.every((token) => title.includes(token));
}

export default function App() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isCompact = width < 380;
  const listColumns = isTablet ? 2 : 1;

  const [query, setQuery] = useState('iphone');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortMode, setSortMode] = useState('relevance');
  const [failedImages, setFailedImages] = useState({});

  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    try {
      const raw = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setWishlist(parsed);
      }
    } catch {
      setWishlist([]);
    }
  }

  async function saveWishlist(next) {
    setWishlist(next);
    try {
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors to avoid blocking UI.
    }
  }

  function toggleWishlist(product) {
    const exists = wishlist.some((item) => item.id === product.id);
    const next = exists
      ? wishlist.filter((item) => item.id !== product.id)
      : [...wishlist, product];
    saveWishlist(next);
  }

  function markImageFailed(productId) {
    setFailedImages((prev) => {
      const currentCount = prev[productId] || 0;
      return { ...prev, [productId]: currentCount + 1 };
    });
  }

  async function searchProducts() {
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Type a search query first.');
      return;
    }

    setLoading(true);
    setError('');
    setFailedImages({});

    try {
      const url = `${API_BASE_URL}/search?q=${encodeURIComponent(trimmed)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const normalized = Array.isArray(data) ? data.map(normalizeProduct) : [];
      const strictMatches = normalized.filter((product) => isStrictRelevantMatch(product, trimmed));
      setProducts(strictMatches);

      if (!strictMatches.length) {
        setError('No strict matches found for this query. Try a shorter query.');
      }
    } catch (err) {
      setError(`Request failed. Check server and API URL. ${err.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const parsedMaxPrice = Number(maxPriceInput);
    const maxPrice = Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0 ? parsedMaxPrice : null;

    let result = products.filter((product) => {
      if (maxPrice !== null && product.price > maxPrice) return false;
      if (inStockOnly && !product.inStock) return false;
      return true;
    });

    if (sortMode === 'priceAsc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortMode === 'priceDesc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else {
      result = [...result].sort((a, b) => b.recommendationScore - a.recommendationScore);
    }

    return result;
  }, [products, maxPriceInput, inStockOnly, sortMode]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>SmartShop Mobile</Text>
        <Text style={styles.subtitle}>Moldova stores price search</Text>
      </View>

      <View style={[styles.searchRow, isCompact && styles.searchRowCompact]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search products..."
          placeholderTextColor="#7c8494"
          style={[styles.input, isCompact && styles.inputCompact]}
          returnKeyType="search"
          onSubmitEditing={searchProducts}
        />
        <Pressable style={[styles.searchButton, isCompact && styles.searchButtonCompact]} onPress={searchProducts}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      <View style={[styles.filters, isCompact && styles.filtersCompact]}>
        <TextInput
          value={maxPriceInput}
          onChangeText={setMaxPriceInput}
          keyboardType="numeric"
          placeholder="Max price (MDL)"
          placeholderTextColor="#7c8494"
          style={[styles.maxPriceInput, isCompact && styles.maxPriceInputCompact]}
        />
        <View style={[styles.switchRow, isCompact && styles.switchRowCompact]}>
          <Text style={styles.filterLabel}>In stock only</Text>
          <Switch value={inStockOnly} onValueChange={setInStockOnly} />
        </View>
      </View>

      <View style={[styles.sortRow, isCompact && styles.sortRowCompact]}>
        {Object.entries(sortModes).map(([mode, label]) => (
          <Pressable
            key={mode}
            onPress={() => setSortMode(mode)}
            style={[styles.sortButton, isCompact && styles.sortButtonCompact, sortMode === mode && styles.sortButtonActive]}
          >
            <Text style={[styles.sortButtonText, sortMode === mode && styles.sortButtonTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{filteredProducts.length} results</Text>
        <Text style={styles.metaText}>Favorites: {wishlist.length}</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0d6efd" />
          <Text style={styles.loadingText}>Searching stores...</Text>
        </View>
      ) : (
        <FlatList
          key={`cols-${listColumns}`}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={listColumns}
          columnWrapperStyle={listColumns > 1 ? styles.cardColumn : undefined}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isFavorite = wishlist.some((fav) => fav.id === item.id);

            return (
              <View style={[styles.card, listColumns > 1 && styles.cardTablet]}>
                {(failedImages[item.id] || 0) < 2 && (item.image || item.imageOriginal) ? (
                  <Image
                    source={{
                      uri: encodeURI((failedImages[item.id] || 0) === 0 ? item.image : item.imageOriginal),
                    }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={() => markImageFailed(item.id)}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>No image</Text>
                  </View>
                )}
                <View style={styles.cardContent}>
                  <View style={styles.cardMetaTop}>
                    <Text style={styles.store}>{item.store}</Text>
                    <Text style={[styles.stockPill, item.inStock ? styles.stockPillIn : styles.stockPillOut]}>
                      {item.inStock ? 'In stock' : 'Out of stock'}
                    </Text>
                  </View>
                  <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>

                  <View style={styles.cardActions}>
                    <Pressable
                      style={[styles.actionButton, styles.linkButton]}
                      onPress={() => {
                        if (item.productUrl) {
                          Linking.openURL(item.productUrl);
                        }
                      }}
                    >
                      <Text style={styles.actionButtonText}>Open</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionButton, isFavorite ? styles.favoriteButtonActive : styles.favoriteButton]}
                      onPress={() => toggleWishlist(item)}
                    >
                      <Text style={styles.actionButtonText}>{isFavorite ? 'Saved' : 'Save'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No results yet. Run a search.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3fb',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  header: {
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d7e0f0',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f2147',
  },
  subtitle: {
    fontSize: 14,
    color: '#4f6288',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchRowCompact: {
    flexDirection: 'column',
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cfdbef',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    color: '#1c2636',
  },
  inputCompact: {
    width: '100%',
  },
  searchButton: {
    backgroundColor: '#1f6feb',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonCompact: {
    minHeight: 44,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  filtersCompact: {
    flexDirection: 'column',
  },
  maxPriceInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cfdbef',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: '#1c2636',
  },
  maxPriceInputCompact: {
    width: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cfdbef',
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  switchRowCompact: {
    justifyContent: 'space-between',
    minHeight: 44,
  },
  filterLabel: {
    color: '#1c2636',
    fontSize: 12,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  sortRowCompact: {
    flexDirection: 'column',
  },
  sortButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c9d8ef',
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#ffffff',
  },
  sortButtonCompact: {
    width: '100%',
  },
  sortButtonActive: {
    backgroundColor: '#1f6feb',
    borderColor: '#1f6feb',
  },
  sortButtonText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#33415c',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  metaText: {
    color: '#485b7f',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#8d1f12',
    marginBottom: 10,
    fontSize: 13,
    backgroundColor: '#ffe5e0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 10,
  },
  loadingText: {
    color: '#455266',
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  cardColumn: {
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d6e0ef',
    shadowColor: '#1b2a4a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTablet: {
    maxWidth: '49%',
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: '#e3ebf8',
  },
  imagePlaceholder: {
    width: '100%',
    height: 190,
    backgroundColor: '#e3ebf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#637594',
    fontWeight: '700',
    fontSize: 13,
  },
  cardContent: {
    padding: 12,
  },
  cardMetaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  store: {
    color: '#0f6e7a',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '60%',
  },
  stockPill: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stockPillIn: {
    color: '#0f9d58',
    backgroundColor: '#e8f7ef',
  },
  stockPillOut: {
    color: '#a02113',
    backgroundColor: '#fde7e3',
  },
  productTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  price: {
    color: '#0f9d58',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  linkButton: {
    backgroundColor: '#14213d',
  },
  favoriteButton: {
    backgroundColor: '#7c8494',
  },
  favoriteButtonActive: {
    backgroundColor: '#d97706',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyText: {
    color: '#5a6577',
    textAlign: 'center',
    marginTop: 24,
  },
});
