import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  Platform,
  Animated,
  RefreshControl,
} from "react-native";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE, AR_SCAN_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";

type Memory = {
  id: string;
  photo_url: string;
  video_url: string;
  caption: string | null;
  mind_file_url: string | null;
};

function AnimatedRow({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ translateY: slide }] }}
    >
      {children}
    </Animated.View>
  );
}

function ScanRow({ item, onPress }: { item: Memory; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const hasMind = !!item.mind_file_url;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.card}
        disabled={!hasMind}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
      >
        <View style={styles.thumbWrap}>
          <Image source={{ uri: item.photo_url }} style={styles.thumb} />
          {hasMind && (
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#FFFDF8" />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.caption} numberOfLines={1}>
            {item.caption || "Untitled"}
          </Text>
          <Text style={hasMind ? styles.ready : styles.notReady}>
            {hasMind ? "Tap to scan" : "Not ready to scan"}
          </Text>
        </View>
        {hasMind && (
          <Ionicons name="chevron-forward" size={20} color="#c9bda4" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ScanScreen() {
  const { token } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<Memory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMemories();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/memories/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const buildScanUrl = (memory: Memory) =>
    `${AR_SCAN_URL}?mind=${encodeURIComponent(
      memory.mind_file_url!
    )}&video=${encodeURIComponent(memory.video_url)}&photo=${encodeURIComponent(
      memory.photo_url
    )}`;

  const handleScanPress = async (memory: Memory) => {
    const url = buildScanUrl(memory);
    if (Platform.OS === "ios") {
      await WebBrowser.openBrowserAsync(url);
    } else {
      setScanning(memory);
    }
  };

  if (scanning) {
    const url = buildScanUrl(scanning);
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setScanning(null)}
        >
          <Text style={styles.closeText}>✕ Close</Text>
        </TouchableOpacity>
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          onPermissionRequest={(event: any) => event.grant()}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D6614A" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Ionicons
          name="camera-outline"
          size={26}
          color="#D6614A"
          style={{ marginBottom: 6 }}
        />
        <Text style={styles.title}>Scan a Memory</Text>
        <Text style={styles.subtitle}>
          point your camera at the printed photo
        </Text>
      </View>

      <FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D6614A"
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No memories yet — add one first.</Text>
        }
        renderItem={({ item, index }) => (
          <AnimatedRow index={index}>
            <ScanRow item={item} onPress={() => handleScanPress(item)} />
          </AnimatedRow>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#14100d" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#14100d",
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#F2E8D5" },
  subtitle: {
    fontSize: 13,
    color: "#b8a88f",
    marginTop: 4,
    fontStyle: "italic",
  },
  empty: {
    textAlign: "center",
    color: "#7d7060",
    marginTop: 40,
    fontStyle: "italic",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#1f1a15",
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#332a20",
  },
  thumbWrap: { position: "relative" },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  cameraBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#D6614A",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1f1a15",
  },
  caption: { fontSize: 15, fontWeight: "600", color: "#F2E8D5" },
  ready: { fontSize: 12, color: "#8fbfa8", marginTop: 3 },
  notReady: { fontSize: 12, color: "#8a7a68", marginTop: 3 },
  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeText: { color: "#F2E8D5", fontSize: 13 },
});