import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OnboardingScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Save email to local storage
      await AsyncStorage.setItem("userEmail", email);

      // Register with server
      const API_URL =
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
      await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email }),
      });

      // Navigate to tabs (dashboard)
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error registering:", error);
      alert("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>📚</Text>
        <Text style={styles.title}>Welcome to{"\n"}Clocked</Text>
        <Text style={styles.subtitle}>
          Stay on top of your Moodle assignments with push notifications
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter your email to get started</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@lafayette.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Setting up..." : "Continue"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  button: {
    width: "100%",
    padding: 16,
    backgroundColor: "#007bff",
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
