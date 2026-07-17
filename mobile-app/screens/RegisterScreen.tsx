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

export default function RegisterScreen({
  onRegisterSuccess,
  onGoToLogin,
}: {
  onRegisterSuccess: (token: string) => void;
  onGoToLogin: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const signupRes = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!signupRes.ok) {
        const err = await signupRes.json().catch(() => ({}));
        Alert.alert("Sign up failed", err.detail || "Something went wrong.");
        return;
      }

      // Auto-login right after successful signup
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        Alert.alert("Account created", "Please log in with your new account.");
        onGoToLogin();
        return;
      }

      const data = await loginRes.json();
      onRegisterSuccess(data.access_token);
    } catch (err) {
      Alert.alert("Error", "Could not reach the server. Check your network/IP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>start collecting your memories</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#c9bda4"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholder="you@example.com"
          placeholderTextColor="#c9bda4"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Choose a password"
          placeholderTextColor="#c9bda4"
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Creating account..." : "Sign Up"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onGoToLogin} style={styles.linkWrap}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextBold}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#F2E8D5", justifyContent: "center", padding: 28 },
  title: { fontSize: 28, fontWeight: "700", color: "#3B2A20", textAlign: "center" },
  subtitle: {
    fontSize: 14,
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
  linkWrap: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#7d6a55", fontSize: 13 },
  linkTextBold: { color: "#D6614A", fontWeight: "700" },
});