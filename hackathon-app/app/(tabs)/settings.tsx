import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

type PetPreference =
  | "auto"
  | "angry"
  | "sad"
  | "good_job"
  | "academic_success";

const PET_OPTIONS: { key: PetPreference; label: string }[] = [
  { key: "auto", label: "Auto" },
  { key: "angry", label: "Angry" },
  { key: "sad", label: "Sad" },
  { key: "good_job", label: "Good Job" },
  { key: "academic_success", label: "Academic Success" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [petPreference, setPetPreference] = useState<PetPreference>("auto");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (userEmail) {
        setEmail(userEmail);
      }

      const pref = (await AsyncStorage.getItem("petPreference")) as
        | PetPreference
        | null;
      if (pref) setPetPreference(pref);

      // Check notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === "granted");
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const setAndPersistPetPreference = async (pref: PetPreference) => {
    try {
      setPetPreference(pref);
      await AsyncStorage.setItem("petPreference", pref);
    } catch (e) {
      console.error("Error saving pet preference", e);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    try {
      if (value) {
        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Please enable notifications in your device settings to receive assignment reminders.",
            [{ text: "OK" }]
          );
          return;
        }

        // Enable notifications on server
        await syncNotificationsWithServer(true);
        setNotificationsEnabled(true);
      } else {
        // Disable notifications on server
        await syncNotificationsWithServer(false);
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      Alert.alert("Error", "Failed to update notification settings");
    }
  };

  const syncNotificationsWithServer = async (enabled: boolean) => {
    try {
      if (!email) return;

      const response = await fetch(`${API_URL}/api/toggle-notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          email,
          enabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle notifications");
      }

      const data = await response.json();
      console.log("Notifications toggled:", data);
    } catch (error) {
      console.error("Error syncing notifications with server:", error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You will need to enter your email again to sign back in.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("userEmail");
              router.replace("/onboarding");
            } catch (error) {
              console.error("Error signing out:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email</Text>
              <Text style={styles.settingValue}>{email}</Text>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive AI-powered reminders about your assignments
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: "#d1d1d6", true: "#34c759" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App Pet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Baty</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Choose Baty</Text>
              <Text style={styles.settingDescription}>
                Pick a mood or choose Auto for screen time-based
              </Text>
              <View style={styles.chipGroup}>
                {PET_OPTIONS.map((opt) => {
                  const selected = petPreference === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setAndPersistPetPreference(opt.key)}
                    >
                      <Text
                        style={[styles.chipText, selected && styles.chipTextSelected]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Clocked v1.0</Text>
          <Text style={styles.footerSubtext}>Made at Lafayette </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: 16,
    color: "#666",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: "#666",
  },
  settingDescription: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: "#3b82f6",
  },
  chipText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#fff",
  },
  signOutButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff3b30",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff3b30",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: "#bbb",
  },
});
