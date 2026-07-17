import React, { useState } from "react";
import { Slot } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

function Gate() {
  const { token, setToken } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  if (!token) {
    if (authMode === "register") {
      return (
        <RegisterScreen
          onRegisterSuccess={setToken}
          onGoToLogin={() => setAuthMode("login")}
        />
      );
    }
    return (
      <LoginScreen
        onLoginSuccess={setToken}
        onGoToRegister={() => setAuthMode("register")}
      />
    );
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