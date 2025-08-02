import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import TranslationScreen from "./src/screens/TranslationScreen";
import VocabularyScreen from "./src/screens/VocabularyScreen";
import TalkScreen from "./src/screens/TalkScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "#8E8E93",
        }}
      >
        <Tab.Screen
          name="Translation"
          component={TranslationScreen}
          options={{
            tabBarLabel: "翻訳",
            title: "日本語-ベトナム語翻訳",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🔄</Text>,
          }}
        />
        <Tab.Screen
          name="Vocabulary"
          component={VocabularyScreen}
          options={{
            tabBarLabel: "単語帳",
            title: "単語帳",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📚</Text>,
          }}
        />
        <Tab.Screen
          name="Talk"
          component={TalkScreen}
          options={{
            tabBarLabel: "会話",
            title: "会話練習",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💬</Text>,
          }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
