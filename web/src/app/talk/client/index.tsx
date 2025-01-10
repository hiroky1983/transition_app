"use client";

import React from "react";
import { Volume2, Mic, Send, Edit2, StopCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { headers } from "@/lib/header";

type Message = {
  role: "user" | "ai";
  content: string;
  translation?: string;
};

type RecordingState = "idle" | "recording" | "processing";

type Props = {
  token: string;
};

export const Client = ({ token }: Props) => {
  const [inputMessage, setInputMessage] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [isBadFeedbackDialogOpen, setIsBadFeedbackDialogOpen] = useState(false);
  const [badFeedbackText, setBadFeedbackText] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // TODO: Implement actual translation API call
    const fakeTranslate = (text: string) =>
      `${text} (ベトナム語に翻訳された文)`;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      translation: fakeTranslate(inputMessage),
    };

    // Add user message to conversation
    setConversation((prev) => [...prev, userMessage]);

    // TODO: Implement API call for AI response
    const aiResponse =
      "Xin chào! Rất vui được gặp bạn. (こんにちは！お会いできて嬉しいです。)";

    // Add AI response to conversation
    setConversation((prev) => [...prev, { role: "ai", content: aiResponse }]);

    setInputMessage("");
    setIsEditing(false);
  };

  const handlePlayAudio = (message: string) => {
    // TODO: Implement audio playback
    console.log("Playing audio:", message);
  };

  const handleSendFeedback = (isGood: boolean) => {
    if (isGood) {
      toast({
        title: "フィードバックを送信しました",
        description: "ありがとうござ���ます。システムの改善に役立てます。",
      });
    } else {
      setIsBadFeedbackDialogOpen(true);
    }
  };

  const handleSendBadFeedback = () => {
    // TODO: Implement bad feedback submission
    console.log("Bad feedback:", badFeedbackText);
    toast({
      title: "フィードバックを送信しました",
      description: "ご意見ありがとうございます。システムの改善に役立てます。",
    });
    setIsBadFeedbackDialogOpen(false);
    setBadFeedbackText("");
  };

  const startRecording = async () => {
    console.log("Requesting microphone access...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        audioChunksRef.current = [];
        handleAudioData(audioBlob);
      };

      mediaRecorderRef.current.start();
      setRecordingState("recording");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "エラー",
        description: "マイクへのアクセスに失敗しました。",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setRecordingState("processing");
    }
  };

  const handleAudioData = async (audioBlob: Blob) => {
    console.log("Audio data:", audioBlob);

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result?.toString().split(",")[1]; // Base64 部分を抽出

      const data = await axios.post(
        "http://localhost:6001/api/speech-to-text",
        { audio: base64Audio },
        headers(token)
      );
      console.log("Speech to text result:", data.data);
      if (data.status !== 200) {
        toast({
          title: "エラー",
          description: "音声入力の処理に失敗しました。",
          variant: "destructive",
        });
        setRecordingState("idle");
        return;
      }
      setTimeout(() => {
        setInputMessage("これは音声入力のシミュレーション結果です。");
        setRecordingState("idle");
        setIsEditing(true);
      }, 1500);
    };
  };
  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-4 rounded-md h-96 overflow-y-auto">
        {conversation.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-2 rounded-md ${
                message.role === "user" ? "bg-blue-500 text-white" : "bg-white"
              }`}
            >
              <p>{message.content}</p>
              {message.role === "user" && message.translation && (
                <div className="mt-2 text-sm text-gray-200">
                  <p>{message.translation}</p>
                  <Button
                    onClick={() => handlePlayAudio(message.translation || "")}
                    size="sm"
                    className="mt-1"
                    aria-label="発音を聞く"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {message.role === "ai" && (
                <Button
                  onClick={() => handlePlayAudio(message.content)}
                  size="sm"
                  className="mt-1"
                  aria-label="発音を聞く"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="音声入力結果を編集"
            className="flex-grow"
          />
        ) : (
          <Button
            onClick={recordingState === "idle" ? startRecording : stopRecording}
            className="flex-grow"
          >
            {recordingState === "idle" && (
              <>
                <Mic className="w-4 h-4 mr-2" />
                音声入力を開始
              </>
            )}
            {recordingState === "recording" && (
              <>
                <StopCircle className="w-4 h-4 mr-2" />
                録音を停止
              </>
            )}
            {recordingState === "processing" && "処理中..."}
          </Button>
        )}
        {isEditing && (
          <Button
            onClick={() => setIsEditing(false)}
            variant="outline"
            aria-label="音声入力に戻る"
          >
            <Mic className="w-4 h-4" />
          </Button>
        )}
        {!isEditing && inputMessage && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            aria-label="テキストを編集"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
        <Button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim()}
          aria-label="メッセージを送信"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          onClick={() => handleSendFeedback(true)}
          variant="outline"
          aria-label="良いフィードバック"
        >
          👍 Good
        </Button>
        <Dialog
          open={isBadFeedbackDialogOpen}
          onOpenChange={setIsBadFeedbackDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => handleSendFeedback(false)}
              variant="outline"
              aria-label="悪いフィードバック"
            >
              👎 Bad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>フィードバックを送信</DialogTitle>
              <DialogDescription>
                改善すべき点を具体的に教えてください。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                value={badFeedbackText}
                onChange={(e) => setBadFeedbackText(e.target.value)}
                placeholder="フィードバックを入力してください"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleSendBadFeedback} type="submit">
                送信
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
