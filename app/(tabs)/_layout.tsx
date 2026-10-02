import { Tabs } from "expo-router";
import { HapticTab } from "@/components/haptic-tab";
import { Icon, palette } from "@/components/finance-ui";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: palette.lime, tabBarInactiveTintColor: palette.muted, tabBarButton: HapticTab, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" }, tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: 64 + bottomPadding, backgroundColor: palette.surface, borderTopColor: palette.border, borderTopWidth: 1 } }}>
    <Tabs.Screen name="index" options={{ title: "Visão geral", tabBarIcon: ({ color }) => <Icon name="grid-outline" size={21} color={String(color)} /> }} />
    <Tabs.Screen name="entries" options={{ title: "Lançamentos", tabBarIcon: ({ color }) => <Icon name="list-outline" size={22} color={String(color)} /> }} />
    <Tabs.Screen name="planning" options={{ title: "Planejar", tabBarIcon: ({ color }) => <Icon name="flag-outline" size={21} color={String(color)} /> }} />
    <Tabs.Screen name="connect" options={{ title: "Conectar", tabBarIcon: ({ color }) => <Icon name="link-outline" size={21} color={String(color)} /> }} />
  </Tabs>;
}
