import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

type TabIcon = React.ComponentProps<typeof Ionicons>["name"];

const tabs: { name: string; title: string; icon: TabIcon; iconFocused: TabIcon }[] = [
  { name: "index", title: "Home", icon: "home-outline", iconFocused: "home" },
  { name: "analytics", title: "Analytics", icon: "pie-chart-outline", iconFocused: "pie-chart" },
  { name: "shifts", title: "Log Shift", icon: "add", iconFocused: "add" },
  { name: "calendar", title: "Calendar", icon: "calendar-outline", iconFocused: "calendar" },
  { name: "chat", title: "AI", icon: "sparkles-outline", iconFocused: "sparkles" },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.port.blue,
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          paddingTop: 8,
          height: 92,
          paddingBottom: 28,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },
      }}
    >
      {tabs.map((tab) => {
        const isLogShift = tab.name === "shifts";

        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused, color }) => {
                if (isLogShift) {
                  return (
                    <View style={styles.fabContainer}>
                      <View style={[styles.fab, focused && styles.fabFocused]}>
                        <Ionicons name="add" size={28} color="#ffffff" />
                      </View>
                    </View>
                  );
                }

                return (
                  <Ionicons
                    name={focused ? tab.iconFocused : tab.icon}
                    size={24}
                    color={color}
                  />
                );
              },
              ...(isLogShift
                ? {
                    tabBarLabel: () => null,
                  }
                : {}),
            }}
          />
        );
      })}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    top: -14,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabFocused: {
    backgroundColor: "#1d4ed8",
    shadowOpacity: 0.5,
  },
});
