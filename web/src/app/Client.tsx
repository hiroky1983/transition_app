"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import { createNotionDatabase, textToSpeech, translate } from "./(actions)/api";

export type NotionDatabase = {
  title: string;
  audio_content: string;
  genre: string;
  name_ja: string;
};

export type TranslateResponse = NotionDatabase | { translatedText: string };

const Client = () => {
  const [inputWord, setInputWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [tags, setTags] = useState("");
  const { toast } = useToast();

  const handleTranslate = async () => {
    setAudioSrc("");
    try {
      const textData = await translate(inputWord);
      if (isNotionResponse(textData.data)) {
        setTranslation(textData.data.title);
        setAudioSrc(textData.data.audio_content);
        setTags(textData.data.genre);
        setInputWord(textData.data.name_ja);
        return;
      }

      setTranslation(textData.data.translatedText);

      const voiceData = await textToSpeech(textData.data.translatedText);
      setAudioSrc(voiceData.data.audioContent);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = async () => {
    await createNotionDatabase({
      title: translation,
      name_ja: inputWord,
      genre: tags,
      audio_content: audioSrc,
    });

    toast({
      title: "保存しました",
      description: `${inputWord} (${translation}) をタグ "${tags}" で保存しました。`,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="word-input">日本語の単語</Label>
        <Input
          id="word-input"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          placeholder="翻訳したい単語を入力"
        />
      </div>
      <Button onClick={handleTranslate}>翻訳</Button>
      {translation && (
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="font-bold">翻訳結果：</p>
          <p>{translation}</p>
          {audioSrc && (
            <audio controls>
              <source
                src={`data:audio/mp3;base64,${audioSrc}`}
                type="audio/mp3"
              />
              <Volume2 className="w-4 h-4" />
            </audio>
          )}
        </div>
      )}
      {translation && (
        <>
          <div>
            <Label htmlFor="tags-input">タグ</Label>
            <Input
              id="tags-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="カンマ区切りでタグを入力"
            />
          </div>
          <Button onClick={handleSave}>保存</Button>
        </>
      )}
    </div>
  );
};

function isNotionResponse(data: TranslateResponse): data is NotionDatabase {
  return "tag" in data && "audio" in data && "name_ja" in data;
}

export default Client;
