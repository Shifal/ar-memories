import React, { useState } from "react";
import { Slot } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import { Fraunces_600SemiBold_Italic } from "@expo-google-fonts/fraunces";
import { Caveat_600SemiBold } from "@expo-google-fonts/caveat";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { IBMPlexSans_400Regular, IBMPlexSans_600SemiBold } from "@expo-google-fonts/ibm-plex-sans";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import AnimatedSplash from "../components/AnimatedSplash";

function Gate() {
  const { token, setToken } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  if (!token) {
    if (authMode === "register") {
      return <RegisterScreen onRegisterSuccess={setToken} onGoToLogin={() => setAuthMode("login")} />;
    }
    return <LoginScreen onLoginSuccess={setToken} onGoToRegister={() => setAuthMode("register")} />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold_Italic,
    Caveat_600SemiBold,
    IBMPlexMono_500Medium,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  const [splashDone, setSplashDone] = useState(false);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F2E8D5" }}>
        <ActivityIndicator color="#D6614A" />
      </View>
    );
  }

  return (
    <AuthProvider>
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
      {splashDone && <Gate />}
    </AuthProvider>
  );
}