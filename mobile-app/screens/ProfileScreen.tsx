import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";

export default function ProfileScreen() {
  const { token, setToken } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmail(data.email);
        setName(data.name || "");
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    setSavingName(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setEditingName(false);
      } else {
        Alert.alert("Error", "Could not update name.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not reach the server.");
    } finally {
      setSavingName(false);
    }
  };

  const submitPasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Missing info", "Both password fields are required.");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (res.ok) {
        Alert.alert("Success", "Password updated.");
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert("Error", err.detail || "Could not update password.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not reach the server.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D6614A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={40} color="#FFFDF8" />
        </View>

        <Text style={styles.name}>{name || "Unnamed user"}</Text>
        <Text style={styles.sub}>AR Memories member</Text>

        {/* Editable name card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Display Name</Text>
          {editingName ? (
            <>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />
              <View style={styles.rowButtons}>
                <TouchableOpacity style={styles.smallButton} onPress={saveName} disabled={savingName}>
                  <Text style={styles.smallButtonText}>{savingName ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, styles.smallButtonGhost]}
                  onPress={() => setEditingName(false)}
                >
                  <Text style={styles.smallButtonGhostText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.row}>
              <Text style={styles.rowText}>{name || "—"}</Text>
              <TouchableOpacity onPress={() => setEditingName(true)}>
                <Ionicons name="pencil-outline" size={18} color="#D6614A" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Email (read-only) */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Email</Text>
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={18} color="#7d6a55" />
            <Text style={styles.rowText}>{email ?? "—"}</Text>
          </View>
        </View>

        {/* Change password */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowPasswordForm(!showPasswordForm)}
          >
            <Ionicons name="lock-closed-outline" size={18} color="#7d6a55" />
            <Text style={styles.rowText}>Change Password</Text>
            <Ionicons
              name={showPasswordForm ? "chevron-up" : "chevron-down"}
              size={16}
              color="#a89a83"
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          {showPasswordForm && (
            <View style={{ marginTop: 14 }}>
              <TextInput
                style={styles.input}
                placeholder="Current password"
                placeholderTextColor="#c9bda4"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="New password"
                placeholderTextColor="#c9bda4"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                style={[styles.smallButton, { marginTop: 14 }]}
                onPress={submitPasswordChange}
                disabled={changingPassword}
              >
                <Text style={styles.smallButtonText}>
                  {changingPassword ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#D6614A" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F2E8D5" },
  container: { alignItems: "center", paddingTop: 70, paddingHorizontal: 24, paddingBottom: 50 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F2E8D5" },
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
  sub: { fontSize: 13, color: "#7d6a55", fontStyle: "italic", marginTop: 2, marginBottom: 24 },
  card: {
    backgroundColor: "#FFFDF8",
    borderRadius: 10,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e8dcc3",
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#a89a83",
    fontWeight: "600",
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontSize: 14, color: "#3B2A20", flexShrink: 1 },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#e0d3b8",
    paddingVertical: 8,
    fontSize: 15,
    color: "#3B2A20",
  },
  rowButtons: { flexDirection: "row", gap: 10, marginTop: 12 },
  smallButton: {
    backgroundColor: "#D6614A",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  smallButtonText: { color: "#FFFDF8", fontWeight: "700", fontSize: 13 },
  smallButtonGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#D6614A" },
  smallButtonGhostText: { color: "#D6614A", fontWeight: "700", fontSize: 13 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#D6614A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  logoutText: { color: "#D6614A", fontWeight: "700", fontSize: 14 },
});