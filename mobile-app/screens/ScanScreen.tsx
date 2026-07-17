import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, ActivityIndicator, Platform } from "react-native";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import { API_BASE, AR_SCAN_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";

type Memory = {
  id: string;
  photo_url: string;
  video_url: string;
  caption: string | null;
  mind_file_url: string | null;
};

export default function ScanScreen() {
  const { token } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<Memory | null>(null);

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
      // ignore, show empty state
    } finally {
      setLoading(false);
    }
  };

  const buildScanUrl = (memory: Memory) =>
  `${AR_SCAN_URL}?mind=${encodeURIComponent(memory.mind_file_url!)}&video=${encodeURIComponent(memory.video_url)}&photo=${encodeURIComponent(memory.photo_url)}`;

  const handleScanPress = async (memory: Memory) => {
    const url = buildScanUrl(memory);

    if (Platform.OS === "ios") {
      // iOS: open in a real Safari view — camera access works properly here,
      // unlike inside Expo Go's embedded WebView.
      await WebBrowser.openBrowserAsync(url);
    } else {
      // Android: embedded WebView (works better on Android even inside Expo Go;
      // will be fully native once the Android dev client build is ready).
      setScanning(memory);
    }
  };

  if (scanning) {
    const url = buildScanUrl(scanning);
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setScanning(null)}>
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
          onPermissionRequest={(event: any) => {
            event.grant();
          }}
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
      <Text style={styles.title}>Choose a Memory</Text>
      <Text style={styles.subtitle}>tap one to start scanning</Text>

      <FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No memories yet — add one first.</Text>}
        renderItem={({ item }) => {
          const hasMind = !!item.mind_file_url;
          return (
            <TouchableOpacity
              style={styles.card}
              disabled={!hasMind}
              onPress={() => handleScanPress(item)}
            >
              <Image source={{ uri: item.photo_url }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.caption}>{item.caption || "Untitled"}</Text>
                <Text style={hasMind ? styles.ready : styles.notReady}>
                  {hasMind ? "Ready to scan" : "Not ready"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F2E8D5", paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F2E8D5" },
  title: { fontSize: 24, fontWeight: "700", color: "#3B2A20", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#7d6a55", textAlign: "center", fontStyle: "italic", marginTop: 4 },
  empty: { textAlign: "center", color: "#a89a83", marginTop: 40, fontStyle: "italic" },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFDF8",
    borderRadius: 10,
    marginBottom: 14,
    padding: 10,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e8dcc3",
  },
  thumb: { width: 60, height: 60, borderRadius: 6 },
  caption: { fontSize: 15, fontWeight: "600", color: "#3B2A20" },
  ready: { fontSize: 12, color: "#6E8E82", marginTop: 4 },
  notReady: { fontSize: 12, color: "#D6614A", marginTop: 4 },
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