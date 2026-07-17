import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { API_BASE } from "../config";

export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) {
  const [email, setEmail] = useState("testuser@example.com");
  const [password, setPassword] = useState("TestPassword123!");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        Alert.alert("Login failed", "Check your email and password.");
        return;
      }
      const data = await res.json();
      onLoginSuccess(data.access_token);
    } catch (err) {
      Alert.alert("Error", "Could not reach the server. Check your network/IP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>AR Memories</Text>
        <Text style={styles.subtitle}>where a photo remembers what happened</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholderTextColor="#c9bda4"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#c9bda4"
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Logging in..." : "Log In"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#F2E8D5", justifyContent: "center", padding: 28 },
  title: { fontSize: 30, fontWeight: "700", color: "#3B2A20", textAlign: "center" },
  subtitle: {
    fontSize: 15,
    color: "#7d6a55",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 30,
    fontStyle: "italic",
  },
  label: { fontSize: 12, color: "#a89a83", textTransform: "uppercase", marginBottom: 6, marginTop: 12 },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#e0d3b8",
    paddingVertical: 10,
    fontSize: 16,
    color: "#3B2A20",
  },
  button: {
    marginTop: 30,
    backgroundColor: "#D6614A",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: { color: "#FFFDF8", fontWeight: "700", fontSize: 15 },
});