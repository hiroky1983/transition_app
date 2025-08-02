import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { getVocabularyList } from "../services/api";

import { VocabularyItem, VocabularyListResponse } from "../services/api";

type SearchFormData = {
  searchTerm: string;
};

export default function VocabularyScreen() {
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([]);
  const [filteredList, setFilteredList] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { control, watch } = useForm<SearchFormData>({
    defaultValues: {
      searchTerm: "",
    },
  });

  const watchedSearchTerm = watch("searchTerm");

  useEffect(() => {
    fetchVocabularyList();
  }, []);

  useEffect(() => {
    if (watchedSearchTerm === "") {
      setFilteredList(vocabularyList);
    } else {
      const filtered = vocabularyList.filter(
        (item) =>
          item.name_ja
            .toLowerCase()
            .includes(watchedSearchTerm.toLowerCase()) ||
          item.name_vi
            .toLowerCase()
            .includes(watchedSearchTerm.toLowerCase()) ||
          item.tag.toLowerCase().includes(watchedSearchTerm.toLowerCase())
      );
      setFilteredList(filtered);
    }
  }, [watchedSearchTerm, vocabularyList]);

  const fetchVocabularyList = async () => {
    try {
      setLoading(true);
      const response = await getVocabularyList();
      const data: VocabularyListResponse = response.data;
      setVocabularyList(data.vocabulary_list);
      setFilteredList(data.vocabulary_list);
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "単語帳の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const renderVocabularyItem = ({ item }: { item: VocabularyItem }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.japaneseText}>{item.name_ja}</Text>
        <Text style={styles.vietnameseText}>{item.name_vi}</Text>
        {item.tag && (
          <View style={styles.tagContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>単語帳を読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>単語帳一覧</Text>

      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <Text style={styles.label}>検索</Text>
        <Controller
          control={control}
          name="searchTerm"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.searchInput}
              placeholder="日本語、ベトナム語、タグで検索..."
              value={value}
              onChangeText={onChange}
            />
          )}
        />
      </View>

      {/* 統計情報 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          総単語数: {vocabularyList.length} | 表示中: {filteredList.length}
        </Text>
      </View>

      {/* 単語一覧 */}
      {filteredList.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {watchedSearchTerm
              ? "検索条件に一致する単語が見つかりません"
              : "単語帳が空です"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          renderItem={renderVocabularyItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  searchContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: "#666",
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  japaneseText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  vietnameseText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#1976d2",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
