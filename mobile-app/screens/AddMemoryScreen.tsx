import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE } from "../config";

export default function AddMemoryScreen({ token }: { token: string }) {
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled) setVideo(result.assets[0]);
  };

  const upload = async () => {
    if (!photo || !video) {
      Alert.alert("Missing files", "Please select both a photo and a video.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("photo", { uri: photo.uri, name: "photo.jpg", type: "image/jpeg" } as any);
    formData.append("video", { uri: video.uri, name: "video.mp4", type: "video/mp4" } as any);
    formData.append("caption", caption);

    try {
      const res = await fetch(`${API_BASE}/memories/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        Alert.alert("Upload failed", errText);
        return;
      }

      Alert.alert("Success", "Memory uploaded!");
      setPhoto(null);
      setVideo(null);
      setCaption("");
    } catch (err) {
      Alert.alert("Error", "Could not reach the server.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Text style={styles.eyebrow}>New Memory</Text>
        <Text style={styles.title}>Add a Memory</Text>
        <Text style={styles.subtitle}>a photo, a video, a moment to keep</Text>

        <Text style={styles.label}>Photo</Text>
        <TouchableOpacity style={styles.pickerBox} onPress={pickPhoto}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.preview} />
          ) : (
            <View style={styles.pickerEmpty}>
              <Ionicons name="image-outline" size={28} color="#c9bda4" />
              <Text style={styles.pickerText}>Tap to choose a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Video</Text>
        <TouchableOpacity style={styles.pickerBox} onPress={pickVideo}>
          <View style={styles.pickerEmpty}>
            <Ionicons
              name={video ? "checkmark-circle" : "videocam-outline"}
              size={28}
              color={video ? "#6E8E82" : "#c9bda4"}
            />
            <Text style={styles.pickerText}>{video ? "Video selected" : "Tap to choose a video"}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>Caption</Text>
        <TextInput
          style={styles.captionInput}
          placeholder="What's happening in this memory?"
          placeholderTextColor="#c9bda4"
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        <TouchableOpacity
          style={[styles.button, uploading && styles.buttonDisabled]}
          onPress={upload}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>{uploading ? "Uploading..." : "Upload Memory"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F2E8D5" },
  container: { padding: 24, paddingTop: 70, paddingBottom: 50 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#6E8E82",
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "600",
  },
  title: { fontSize: 26, fontWeight: "700", color: "#3B2A20", textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: "#7d6a55",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 28,
    fontStyle: "italic",
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#a89a83",
    marginBottom: 8,
    fontWeight: "600",
  },
  pickerBox: {
    backgroundColor: "#FFFDF8",
    borderRadius: 10,
    height: 130,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e8dcc3",
    overflow: "hidden",
    shadowColor: "#3B2A20",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 1,
  },
  pickerEmpty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
  pickerText: { color: "#a89a83", fontSize: 13 },
  preview: { width: "100%", height: "100%" },
  captionInput: {
    backgroundColor: "#FFFDF8",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#e8dcc3",
    marginBottom: 26,
    textAlignVertical: "top",
    color: "#3B2A20",
    shadowColor: "#3B2A20",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 1,
  },
  button: {
    backgroundColor: "#D6614A",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#b84e39",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 0,
    elevation: 2,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFFDF8", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },
});