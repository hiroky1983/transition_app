"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import { createNotionDatabase, textToSpeech, translate } from "./(actions)/api";

export type NotionDatabase = {
  title: string;
  genre: string;
  name_ja: string;
};

export type TranslateResponse = NotionDatabase | { translatedText: string };

type TranslateFormData = {
  inputWord: string;
};

type SaveFormData = {
  tags: string;
};

const Client = () => {
  const [translation, setTranslation] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [originalWord, setOriginalWord] = useState("");
  const { toast } = useToast();
  
  const translateForm = useForm<TranslateFormData>({
    defaultValues: {
      inputWord: ""
    }
  });
  
  const saveForm = useForm<SaveFormData>({
    defaultValues: {
      tags: ""
    }
  });

  const handleTranslate = async (data: TranslateFormData) => {
    setAudioSrc("");
    try {
      const textData = await translate(data.inputWord);
      if (isNotionResponse(textData.data)) {
        setTranslation(textData.data.title);
        saveForm.setValue("tags", textData.data.genre);
        setOriginalWord(textData.data.name_ja);
        translateForm.setValue("inputWord", textData.data.name_ja);
        return;
      }

      setTranslation(textData.data.translatedText);
      setOriginalWord(data.inputWord);

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

  const handleSave = async (data: SaveFormData) => {
    await createNotionDatabase({
      title: translation,
      name_ja: originalWord,
      genre: data.tags,
    });

    toast({
      title: "保存しました",
      description: `${originalWord} (${translation}) をタグ "${data.tags}" で保存しました。`,
    });
    
    // フォームをリセット
    translateForm.reset();
    saveForm.reset();
    setTranslation("");
    setAudioSrc("");
    setOriginalWord("");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={translateForm.handleSubmit(handleTranslate)} className="space-y-4">
        <div>
          <Label htmlFor="word-input">日本語の単語</Label>
          <Input
            id="word-input"
            {...translateForm.register("inputWord", { required: "単語を入力してください" })}
            placeholder="翻訳したい単語を入力"
          />
          {translateForm.formState.errors.inputWord && (
            <p className="text-red-500 text-sm mt-1">
              {translateForm.formState.errors.inputWord.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={translateForm.formState.isSubmitting}>
          {translateForm.formState.isSubmitting ? "翻訳中..." : "翻訳"}
        </Button>
      </form>
      
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
        <form onSubmit={saveForm.handleSubmit(handleSave)} className="space-y-4">
          <div>
            <Label htmlFor="tags-input">タグ</Label>
            <Input
              id="tags-input"
              {...saveForm.register("tags", { required: "タグを入力してください" })}
              placeholder="カンマ区切りでタグを入力"
            />
            {saveForm.formState.errors.tags && (
              <p className="text-red-500 text-sm mt-1">
                {saveForm.formState.errors.tags.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={saveForm.formState.isSubmitting}>
            {saveForm.formState.isSubmitting ? "保存中..." : "保存"}
          </Button>
        </form>
      )}
    </div>
  );
};

function isNotionResponse(data: TranslateResponse): data is NotionDatabase {
  return "genre" in data && "name_ja" in data;
}

export default Client;
