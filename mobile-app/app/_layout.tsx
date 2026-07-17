import React from "react";
import { Slot } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/LoginScreen";

function Gate() {
  const { token, setToken } = useAuth();

  if (!token) {
    return <LoginScreen onLoginSuccess={setToken} />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}