"use client";

import React from "react";
import { Volume2, Mic, Send, Edit2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

type Message = {
  role: "user" | "ai";
  content: string;
  translation?: string;
};

type RecordingState = "idle" | "recording" | "processing";

// enum Language {
//   EN = "en",
//   VI = "vi",
//   JA = "ja",
// }

export const Client = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
    };

    // Add user message to conversation
    setConversation((prev) => [...prev, userMessage]);

    const res = await axios.post("http://localhost:6001/api/gemini", {
      text: inputMessage,
    });
    // Add AI response to conversation
    setConversation((prev) => [
      ...prev,
      { role: "ai", content: res.data.text },
    ]);

    setInputMessage("");
    setIsEditing(false);
  };

  const handlePlayAudio = (message: string) => {
    // TODO: Implement audio playback
    console.log("Playing audio:", message);
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

        const audioFile = new File([audioBlob], "audio.wav", {
          type: "audio/wav",
        });
        handleAudioData(audioFile);
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

  const handleAudioData = async (audioFile: File) => {
    const formData = new FormData();
    formData.append("audio", audioFile);
    try {
      const res = await axios.post(
        "http://localhost:6001/api/speech-to-text",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setInputMessage(res.data.transcripts[0]);
      console.log("Speech to text result:", res.data);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "エラー",
        description: "音声入力の処理に失敗しました。",
        variant: "destructive",
      });
      setRecordingState("idle");
      return;
    }
    setTimeout(() => {
      setRecordingState("idle");
      setIsEditing(true);
    }, 1500);
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
    </div>
  );
};
