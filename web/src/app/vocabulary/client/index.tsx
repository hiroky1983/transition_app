"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import Link from "next/link";

type VocabularyItem = {
  id: string;
  name_ja: string;
  name_vi: string;
  tag: string;
};

type SearchFormData = {
  searchTerm: string;
};

interface VocabularyClientProps {
  initialVocabularyList: VocabularyItem[];
}

export const VocabularyClient = ({
  initialVocabularyList,
}: VocabularyClientProps) => {
  const [filteredList, setFilteredList] = useState<VocabularyItem[]>(
    initialVocabularyList
  );

  const searchForm = useForm<SearchFormData>({
    defaultValues: {
      searchTerm: "",
    },
  });

  const watchedSearchTerm = searchForm.watch("searchTerm");

  useEffect(() => {
    if (watchedSearchTerm === "") {
      setFilteredList(initialVocabularyList);
    } else {
      const filtered = initialVocabularyList.filter(
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
  }, [watchedSearchTerm, initialVocabularyList]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">単語帳一覧</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          新しい単語を追加
        </Link>
      </div>

      {/* 検索バー */}
      <div className="mb-6">
        <Label htmlFor="search">検索</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="search"
            type="text"
            placeholder="日本語、ベトナム語、タグで検索..."
            {...searchForm.register("searchTerm")}
            className="pl-10"
          />
        </div>
      </div>

      {/* 統計情報 */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          総単語数: {initialVocabularyList.length} | 表示中:{" "}
          {filteredList.length}
        </p>
      </div>

      {/* 単語一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  {item.name_ja}
                </h3>
                <p className="text-blue-600 font-medium">{item.name_vi}</p>
              </div>
            </div>
            {item.tag && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {item.tag}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredList.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {watchedSearchTerm
              ? "検索条件に一致する単語が見つかりません"
              : "単語帳が空です"}
          </p>
          {!watchedSearchTerm && (
            <Link href="/" className="text-blue-500 hover:underline mt-2 block">
              最初の単語を追加しましょう
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
