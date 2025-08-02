import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Audio } from "expo-av";
import {
  translate,
  textToSpeech,
  createNotionDatabase,
  getTags,
  NotionDatabase,
  TranslateResponse,
} from "../services/api";

type TranslateFormData = {
  inputWord: string;
};

type SaveFormData = {
  tags: string[];
};

function isNotionResponse(data: TranslateResponse): data is NotionDatabase {
  return "genre" in data && "name_ja" in data;
}

export default function TranslationScreen() {
  const [translation, setTranslation] = useState("");
  const [audioBase64, setAudioBase64] = useState("");
  const [originalWord, setOriginalWord] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const {
    control: translateControl,
    handleSubmit: handleTranslateSubmit,
    formState: { isSubmitting: isTranslating },
    setValue: setTranslateValue,
    reset: resetTranslate,
  } = useForm<TranslateFormData>({
    defaultValues: { inputWord: "" },
  });

  useEffect(() => {
    fetchAvailableTags();
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const fetchAvailableTags = async () => {
    try {
      const response = await getTags();
      setAvailableTags(response.data.tags);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const handleTranslate = async (data: TranslateFormData) => {
    setAudioBase64("");
    try {
      const textData = await translate(data.inputWord);

      if (isNotionResponse(textData.data)) {
        setTranslation(textData.data.title);
        setSelectedTags([textData.data.genre]);
        setOriginalWord(textData.data.name_ja);
        setTranslateValue("inputWord", textData.data.name_ja);
        return;
      }

      setTranslation(textData.data.translatedText);
      setOriginalWord(data.inputWord);

      const voiceData = await textToSpeech(textData.data.translatedText);
      setAudioBase64(voiceData.data.audioContent);
    } catch (error) {
      Alert.alert("エラー", "Translation failed");
      console.error(error);
    }
  };

  const playAudio = async () => {
    if (!audioBase64) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const audioUri = `data:audio/mp3;base64,${audioBase64}`;
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (error) {
      Alert.alert("エラー", "Audio playback failed");
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      await createNotionDatabase({
        title: translation,
        name_ja: originalWord,
        genre: selectedTags[0] || "",
      });

      Alert.alert(
        "保存しました",
        `${originalWord} (${translation}) をタグ [${selectedTags.join(
          ", "
        )}] で保存しました。`
      );

      fetchAvailableTags();
      resetTranslate();
      setTranslation("");
      setAudioBase64("");
      setOriginalWord("");
      setSelectedTags([]);
    } catch (error) {
      Alert.alert("エラー", "Save failed");
      console.error(error);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>日本語の単語</Text>
        <Controller
          control={translateControl}
          name="inputWord"
          rules={{ required: "単語を入力してください" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                style={styles.input}
                placeholder="翻訳したい単語を入力"
                value={value}
                onChangeText={onChange}
              />
              {error && <Text style={styles.error}>{error.message}</Text>}
            </>
          )}
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleTranslateSubmit(handleTranslate)}
          disabled={isTranslating}
        >
          <Text style={styles.buttonText}>
            {isTranslating ? "翻訳中..." : "翻訳"}
          </Text>
        </TouchableOpacity>
      </View>

      {translation && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>翻訳結果：</Text>
          <Text style={styles.resultText}>{translation}</Text>

          {audioBase64 && (
            <TouchableOpacity
              style={[styles.button, styles.audioButton]}
              onPress={playAudio}
            >
              <Text style={styles.buttonText}>🔊 音声再生</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {translation && (
        <View style={styles.saveForm}>
          <Text style={styles.label}>タグ</Text>
          <View style={styles.tagContainer}>
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  selectedTags.includes(tag) && styles.selectedTag,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.selectedTagText,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>保存</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  form: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  error: {
    color: "#ff0000",
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  audioButton: {
    backgroundColor: "#34C759",
  },
  saveButton: {
    backgroundColor: "#FF9500",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    marginBottom: 12,
  },
  saveForm: {
    marginTop: 16,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  selectedTag: {
    backgroundColor: "#007AFF",
  },
  tagText: {
    color: "#333",
    fontSize: 14,
  },
  selectedTagText: {
    color: "#fff",
  },
});
