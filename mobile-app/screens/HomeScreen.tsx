import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";

type Memory = {
  id: string;
  photo_url: string;
  video_url: string;
  caption: string | null;
  mind_file_url: string | null;
  created_at: string;
};

function PolaroidCard({ item, index, onPress }: { item: Memory; index: number; onPress: () => void }) {
  const fade = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.9)).current;
  const pressScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, delay: index * 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, delay: index * 70, useNativeDriver: true, friction: 6 }),
    ]).start();
  }, []);

  const rotate = index % 2 === 0 ? "-2deg" : "2deg";
  const hasMind = !!item.mind_file_url;

  return (
    <Animated.View
      style={{
        width: "48%",
        opacity: fade,
        transform: [{ scale: Animated.multiply(scale, pressScale) }, { rotate }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      >
        <View style={styles.polaroid}>
          <View style={styles.pin} />
          <Image source={{ uri: item.photo_url }} style={styles.photo} />
          <View style={styles.captionRow}>
            <Text style={styles.caption} numberOfLines={1}>
              {item.caption || "untitled"}
            </Text>
          </View>
          <View style={[styles.stamp, hasMind ? styles.stampReady : styles.stampMissing]}>
            <Text style={[styles.stampText, hasMind ? styles.stampTextReady : styles.stampTextMissing]}>
              {hasMind ? "ready" : "no scan"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function MemoryDetail({
  memory,
  token,
  onBack,
  onUpdated,
  onDeleted,
}: {
  memory: Memory;
  token: string;
  onBack: () => void;
  onUpdated: (updated: Memory) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(memory.caption || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveCaption = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/memories/${memory.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ caption: captionDraft }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdated(updated);
        setEditing(false);
      } else {
        Alert.alert("Error", "Could not update caption.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete this memory?",
      "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete },
      ]
    );
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/memories/${memory.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) {
        onDeleted(memory.id);
      } else {
        Alert.alert("Error", "Could not delete this memory.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not reach the server.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.detailScreen} contentContainerStyle={styles.detailContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backLink}>
          <Ionicons name="chevron-back" size={18} color="#7d6a55" />
          <Text style={styles.backText}>back to memories</Text>
        </TouchableOpacity>

        <View style={styles.detailPhotoWrap}>
          <Image source={{ uri: memory.photo_url }} style={styles.detailPhoto} />
        </View>

        <Text style={styles.detailDate}>{formatDate(memory.created_at)}</Text>

        {editing ? (
          <>
            <TextInput
              style={styles.captionInput}
              value={captionDraft}
              onChangeText={setCaptionDraft}
              placeholder="Add a caption..."
              placeholderTextColor="#c9bda4"
              multiline
            />
            <View style={styles.editRow}>
              <TouchableOpacity style={styles.smallButton} onPress={saveCaption} disabled={saving}>
                <Text style={styles.smallButtonText}>{saving ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, styles.smallButtonGhost]}
                onPress={() => {
                  setCaptionDraft(memory.caption || "");
                  setEditing(false);
                }}
              >
                <Text style={styles.smallButtonGhostText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.detailCaption}>{memory.caption || "Untitled memory"}</Text>
        )}

        <View style={[styles.detailStamp, memory.mind_file_url ? styles.stampReady : styles.stampMissing]}>
          <Ionicons
            name={memory.mind_file_url ? "camera" : "camera-outline"}
            size={12}
            color={memory.mind_file_url ? "#4d6a5f" : "#b84e39"}
          />
          <Text style={[styles.stampText, memory.mind_file_url ? styles.stampTextReady : styles.stampTextMissing]}>
            {memory.mind_file_url ? "  ready to scan" : "  not ready to scan"}
          </Text>
        </View>

        {!editing && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setEditing(true)}>
              <Ionicons name="pencil-outline" size={16} color="#3B2A20" />
              <Text style={styles.actionButtonText}>Edit Caption</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={confirmDelete}
              disabled={deleting}
            >
              <Ionicons name="trash-outline" size={16} color="#D6614A" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                {deleting ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function HomeScreen() {
  const { token } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Memory | null>(null);

  const fetchMemories = useCallback(async () => {
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
    }
  }, [token]);

  useEffect(() => {
    fetchMemories().finally(() => setLoading(false));
  }, [fetchMemories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMemories();
    setRefreshing(false);
  };

  const handleUpdated = (updated: Memory) => {
    setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelected(updated);
  };

  const handleDeleted = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    setSelected(null);
  };

  if (selected) {
    return (
      <MemoryDetail
        memory={selected}
        token={token!}
        onBack={() => setSelected(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
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
        <Text style={styles.eyebrow}>Est. Today</Text>
        <Text style={styles.title}>AR Memories</Text>
        <Text style={styles.subtitle}>tap a photo to relive it</Text>
      </View>

      <FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D6614A" />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>no memories yet{"\n"}add your first one</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <PolaroidCard item={item} index={index} onPress={() => setSelected(item)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F2E8D5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F2E8D5" },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 10, alignItems: "center" },
  eyebrow: {
    fontFamily: "IBMPlexMono_500Medium",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#6E8E82",
    marginBottom: 4,
  },
  title: { fontFamily: "Fraunces_600SemiBold_Italic", fontSize: 28, color: "#3B2A20" },
  subtitle: { fontFamily: "Caveat_600SemiBold", fontSize: 17, color: "#7d6a55", marginTop: 2 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { fontFamily: "Caveat_600SemiBold", fontSize: 20, color: "#a89a83", textAlign: "center" },
  polaroid: {
    backgroundColor: "#FFFDF8",
    padding: 8,
    paddingBottom: 14,
    shadowColor: "#3B2A20",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  pin: {
    position: "absolute",
    top: -6,
    left: "50%",
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#b84e39",
    zIndex: 2,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  photo: { width: "100%", height: 110, backgroundColor: "#e8dcc3" },
  captionRow: { marginTop: 10, paddingHorizontal: 2 },
  caption: { fontFamily: "Caveat_600SemiBold", fontSize: 18, color: "#3B2A20" },
  stamp: { alignSelf: "flex-start", marginTop: 6, marginLeft: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  stampReady: { backgroundColor: "rgba(110,142,130,0.15)" },
  stampMissing: { backgroundColor: "rgba(214,97,74,0.12)" },
  stampText: { fontFamily: "IBMPlexMono_500Medium", fontSize: 9 },
  stampTextReady: { color: "#4d6a5f" },
  stampTextMissing: { color: "#b84e39" },

  detailScreen: { flex: 1, backgroundColor: "#F2E8D5" },
  detailContent: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  backLink: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backText: {
    fontFamily: "IBMPlexMono_500Medium",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#7d6a55",
    marginLeft: 2,
  },
  detailPhotoWrap: {
    backgroundColor: "#FFFDF8",
    padding: 10,
    shadowColor: "#3B2A20",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  detailPhoto: { width: "100%", height: 340, backgroundColor: "#e8dcc3" },
  detailDate: {
    fontFamily: "IBMPlexMono_500Medium",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#a89a83",
    marginBottom: 6,
  },
  detailCaption: { fontFamily: "Caveat_600SemiBold", fontSize: 26, color: "#3B2A20", marginBottom: 16 },
  captionInput: {
    backgroundColor: "#FFFDF8",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 70,
    borderWidth: 1,
    borderColor: "#e8dcc3",
    marginBottom: 10,
    textAlignVertical: "top",
    color: "#3B2A20",
  },
  editRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  smallButton: { backgroundColor: "#D6614A", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 6 },
  smallButtonText: { color: "#FFFDF8", fontWeight: "700", fontSize: 13 },
  smallButtonGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#D6614A" },
  smallButtonGhostText: { color: "#D6614A", fontWeight: "700", fontSize: 13 },
  detailStamp: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: "#e8dcc3",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: { fontSize: 13, fontWeight: "600", color: "#3B2A20" },
  deleteButton: { borderColor: "#D6614A" },
  deleteButtonText: { color: "#D6614A" },
});