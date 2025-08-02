import { VocabularyClient } from "./client";

type VocabularyItem = {
  id: string;
  name_ja: string;
  name_vi: string;
  tag: string;
};

type VocabularyListResponse = {
  vocabulary_list: VocabularyItem[];
  total_count: number;
};

async function getVocabularyList(): Promise<VocabularyListResponse> {
  try {
    const res = await fetch("http://localhost:6001/api/vocabulary-list", {
      cache: "no-store", // Always fetch fresh data
    });

    if (!res.ok) {
      throw new Error("Failed to fetch vocabulary list");
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching vocabulary list:", error);
    // Return empty list on error
    return {
      vocabulary_list: [],
      total_count: 0,
    };
  }
}

export default async function VocabularyPage() {
  const vocabularyData = await getVocabularyList();

  return (
    <VocabularyClient initialVocabularyList={vocabularyData.vocabulary_list} />
  );
}
