import React, { useState, useRef } from "react";
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
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE } from "../config";

export default function AddMemoryScreen({ token }: { token: string }) {
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [stageLabel, setStageLabel] = useState("");

  const progressAnim = useRef(new Animated.Value(0)).current;

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

  const animateProgressTo = (value: number) => {
    Animated.timing(progressAnim, {
      toValue: value,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const upload = async () => {
    if (!photo || !video) {
      Alert.alert("Missing files", "Please select both a photo and a video.");
      return;
    }

    setUploading(true);
    setUploadPercent(0);
    animateProgressTo(0);
    setStageLabel("Preparing upload...");

    const formData = new FormData();
    formData.append("photo", { uri: photo.uri, name: "photo.jpg", type: "image/jpeg" } as any);
    formData.append("video", { uri: video.uri, name: "video.mp4", type: "video/mp4" } as any);
    formData.append("caption", caption);

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/memories/`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // Upload transfer itself is roughly the first 60% of the whole process
            // (the rest is server-side .mind generation + embedding, which we can't
            // measure directly, so we show an indeterminate "processing" stage after).
            const transferPercent = Math.round((event.loaded / event.total) * 60);
            setUploadPercent(transferPercent);
            animateProgressTo(transferPercent);
            setStageLabel(
              transferPercent < 60 ? "Uploading photo & video..." : "Upload complete, processing..."
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadPercent(100);
            animateProgressTo(100);
            setStageLabel("Done!");
            resolve();
          } else {
            reject(new Error(xhr.responseText || `Server error (${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error — could not reach the server."));

        // Once the transfer itself finishes (readyState 4 isn't reached yet, but upload
        // side is done), nudge the bar into an indeterminate "still working" state
        // since .mind generation + embedding happen server-side after transfer completes.
        xhr.upload.onload = () => {
          setStageLabel("Generating AR tracking file...");
          animateProgressTo(85);
        };

        xhr.send(formData);
      });

      Alert.alert("Success", "Memory uploaded!");
      setPhoto(null);
      setVideo(null);
      setCaption("");
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong.");
    } finally {
      setUploading(false);
      setUploadPercent(0);
      progressAnim.setValue(0);
      setStageLabel("");
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>New Memory</Text>
        <Text style={styles.title}>Add a Memory</Text>
        <Text style={styles.subtitle}>a photo, a video, a moment to keep</Text>

        <Text style={styles.label}>Photo</Text>
        <TouchableOpacity style={styles.pickerBox} onPress={pickPhoto} disabled={uploading}>
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
        <TouchableOpacity style={styles.pickerBox} onPress={pickVideo} disabled={uploading}>
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
          editable={!uploading}
        />

        {uploading && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressLabel}>{stageLabel}</Text>
          </View>
        )}

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
    marginBottom: 10,
    textAlignVertical: "top",
    color: "#3B2A20",
    shadowColor: "#3B2A20",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 1,
  },
  progressWrap: { marginTop: 16, marginBottom: 6 },
  progressTrack: {
    height: 8,
    backgroundColor: "#e8dcc3",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#D6614A",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: "#7d6a55",
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#D6614A",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#b84e39",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 0,
    elevation: 2,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFFDF8", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },
});