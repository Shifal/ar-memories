import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";

export default function ProfileScreen() {
  const { token, setToken } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEmail(data.email);
        }
      } catch (err) {
        // silently ignore, show fallback
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    setToken(null);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.avatarCircle}>
        <Ionicons name="person" size={40} color="#FFFDF8" />
      </View>

      {loading ? (
        <ActivityIndicator color="#D6614A" style={{ marginTop: 20 }} />
      ) : (
        <>
          <Text style={styles.name}>{email ?? "Unknown user"}</Text>
          <Text style={styles.sub}>AR Memories member</Text>
        </>
      )}

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={18} color="#7d6a55" />
          <Text style={styles.rowText}>{email ?? "—"}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#D6614A" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F2E8D5", alignItems: "center", paddingTop: 80, paddingHorizontal: 24 },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#D6614A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  name: { fontSize: 20, fontWeight: "700", color: "#3B2A20" },
  sub: { fontSize: 13, color: "#7d6a55", fontStyle: "italic", marginTop: 2, marginBottom: 28 },
  card: {
    backgroundColor: "#FFFDF8",
    borderRadius: 10,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e8dcc3",
    marginBottom: 30,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontSize: 14, color: "#3B2A20" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#D6614A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutText: { color: "#D6614A", fontWeight: "700", fontSize: 14 },
});