import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { gemini, speechToText } from "../services/api";

type Message = {
  role: "user" | "model";
  content: string;
  translation?: string;
};

type RecordingState = "idle" | "recording" | "processing";

type MessageFormData = {
  inputMessage: string;
};

export default function TalkScreen() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [isEditing, setIsEditing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const { control, handleSubmit, watch, setValue, reset, formState } =
    useForm<MessageFormData>({
      defaultValues: { inputMessage: "" },
    });

  const watchedInputMessage = watch("inputMessage");

  const handleSendMessage = async (data: MessageFormData) => {
    if (!data.inputMessage.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: data.inputMessage,
    };

    setConversation((prev) => [...prev, userMessage]);

    try {
      const res = await gemini(data.inputMessage);
      setConversation((prev) => [
        ...prev,
        { role: "model", content: res.data.text },
      ]);
    } catch (error) {
      Alert.alert("エラー", "メッセージの送信に失敗しました。");
    }

    reset();
    setIsEditing(false);
  };

  const handlePlayAudio = async (message: string) => {
    try {
      // TODO: Implement text-to-speech for AI responses
      Alert.alert("音声再生", `音声再生機能は実装予定です: ${message}`);
    } catch (error) {
      Alert.alert("エラー", "音声の再生に失敗しました。");
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("エラー", "マイクへのアクセス許可が必要です。");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setRecordingState("recording");
    } catch (error) {
      console.error("Failed to start recording", error);
      Alert.alert("エラー", "録音の開始に失敗しました。");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setRecordingState("processing");

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (uri) {
        await handleAudioData(uri);
      }

      setRecording(null);
    } catch (error) {
      console.error("Failed to stop recording", error);
      Alert.alert("エラー", "録音の停止に失敗しました。");
      setRecordingState("idle");
    }
  };

  const handleAudioData = async (audioUri: string) => {
    try {
      // Create FormData for audio upload
      const formData = new FormData();

      // Read the audio file and append to FormData
      formData.append("audio", {
        uri: audioUri,
        name: "audio.m4a",
        type: "audio/m4a",
      } as any);

      const res = await speechToText(formData);
      setValue("inputMessage", res.data.transcripts[0]);

      setTimeout(() => {
        setRecordingState("idle");
        setIsEditing(true);
      }, 1500);
    } catch (error) {
      console.error("Error processing audio:", error);
      Alert.alert("エラー", "音声入力の処理に失敗しました。");
      setRecordingState("idle");
    }
  };

  const renderMessage = (message: Message, index: number) => (
    <View
      key={index}
      style={[
        styles.messageContainer,
        message.role === "user" ? styles.userMessage : styles.modelMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.role === "user" ? styles.userBubble : styles.modelBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.role === "user" ? styles.userText : styles.modelText,
          ]}
        >
          {message.content}
        </Text>
        {message.role === "user" && message.translation && (
          <Text style={styles.translationText}>{message.translation}</Text>
        )}
        {message.role === "model" && (
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => handlePlayAudio(message.content)}
          >
            <Text style={styles.audioButtonText}>🔊</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.conversationContainer}>
        {conversation.map(renderMessage)}
      </ScrollView>

      <View style={styles.inputContainer}>
        {isEditing ? (
          <View style={styles.editingContainer}>
            <Controller
              control={control}
              name="inputMessage"
              rules={{ required: "メッセージを入力してください" }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.textInput}
                  placeholder="音声入力結果を編集"
                  value={value}
                  onChangeText={onChange}
                  multiline
                />
              )}
            />
            <TouchableOpacity
              style={styles.micButton}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.buttonText}>🎤</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.recordButton,
              recordingState === "recording" && styles.recordingButton,
            ]}
            onPress={recordingState === "idle" ? startRecording : stopRecording}
            disabled={recordingState === "processing"}
          >
            <Text style={styles.recordButtonText}>
              {recordingState === "idle" && "🎤 音声入力を開始"}
              {recordingState === "recording" && "⏹️ 録音を停止"}
              {recordingState === "processing" && "処理中..."}
            </Text>
          </TouchableOpacity>
        )}

        {!isEditing && watchedInputMessage && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.buttonText}>✏️</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!watchedInputMessage.trim() || formState.isSubmitting) &&
              styles.disabledButton,
          ]}
          onPress={handleSubmit(handleSendMessage)}
          disabled={!watchedInputMessage.trim() || formState.isSubmitting}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  conversationContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  modelMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#007AFF",
  },
  modelBubble: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: "#fff",
  },
  modelText: {
    color: "#333",
  },
  translationText: {
    fontSize: 14,
    color: "#e0e0e0",
    marginTop: 4,
  },
  audioButton: {
    marginTop: 8,
    padding: 4,
  },
  audioButtonText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  editingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  recordButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    marginRight: 8,
  },
  recordingButton: {
    backgroundColor: "#FF3B30",
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  micButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  editButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
