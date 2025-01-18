"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const Client = () => {
  const [inputWord, setInputWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [tags, setTags] = useState("");
  const { toast } = useToast();

  const handleTranslate = async () => {
    setAudioSrc("");
    const textData = await axios.post("http://localhost:6001/api/translate", {
      text: inputWord, // リクエストボディ
    });

    setTranslation(textData.data.translatedText);

    const voiceData = await axios.post(
      "http://localhost:6001/api/text-to-speech",
      {
        text: textData.data.translatedText, // リクエストボディ
      }
    );

    setAudioSrc(voiceData.data.audioContent);
  };

  const handleSave = async () => {
    // TODO: Implement save to database
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

export default Client;
