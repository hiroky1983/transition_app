import axios from "axios";
import { NotionDatabase } from "../Client";

export const translate = async (inputWord: string) =>
  await axios.post("http://localhost:6001/api/translate", {
    text: inputWord, // リクエストボディ
  });

export const textToSpeech = async (textData: string) =>
  await axios.post("http://localhost:6001/api/text-to-speech", {
    text: textData, // リクエストボディ
  });

export const speechToText = async (formData: FormData) =>
  await axios.post("http://localhost:6001/api/speech-to-text", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const gemini = async (inputMessage: string) =>
  await axios.post("http://localhost:6001/api/gemini", {
    text: inputMessage,
  });

export const createNotionDatabase = async (input: NotionDatabase) => {
  await axios.post("http://localhost:6001/api/create-notion", {
    title: input.title,
    name_ja: input.name_ja,
    genre: input.genre,
    audio_content: input.audio_content,
  });
};
