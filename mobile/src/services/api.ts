import axios, { AxiosResponse } from "axios";

export type NotionDatabase = {
  title: string;
  genre: string;
  name_ja: string;
};

// Server response when word is found in Notion
export type NotionFoundResponse = {
  translatedText: string;
  tag: string;
  name_ja: string;
};

// Server response when word is not found (new translation)
export type NewTranslationResponse = {
  translatedText: string;
};

export type TranslateResponse = NotionFoundResponse | NewTranslationResponse;

export type VocabularyItem = {
  id: string;
  name_ja: string;
  name_vi: string;
  tag: string;
};

export type VocabularyListResponse = {
  vocabulary_list: VocabularyItem[];
  total_count: number;
};

export type TextToSpeechResponse = {
  audioContent: string;
};

export type SpeechToTextResponse = {
  transcripts: string[];
};

export type GeminiResponse = {
  text: string;
};

export type TagsResponse = {
  tags: string[];
};

// TODO: Replace with your actual server URL
const BASE_URL = "http://localhost:6001";

export const translate = async (
  inputWord: string
): Promise<AxiosResponse<TranslateResponse>> => {
  return await axios.post(`${BASE_URL}/api/translate`, {
    text: inputWord,
  });
};

export const textToSpeech = async (
  textData: string
): Promise<AxiosResponse<TextToSpeechResponse>> => {
  return await axios.post(`${BASE_URL}/api/text-to-speech`, {
    translatedText: textData,
  });
};

export const speechToText = async (
  formData: FormData
): Promise<AxiosResponse<SpeechToTextResponse>> => {
  return await axios.post(`${BASE_URL}/api/speech-to-text`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const gemini = async (
  inputMessage: string
): Promise<AxiosResponse<GeminiResponse>> => {
  return await axios.post(`${BASE_URL}/api/gemini`, {
    text: inputMessage,
  });
};

export const createNotionDatabase = async (
  input: NotionDatabase
): Promise<AxiosResponse<{ status: string; response: any }>> => {
  return await axios.post(`${BASE_URL}/api/create-notion`, {
    title: input.title,
    name_ja: input.name_ja,
    genre: input.genre,
  });
};

export const getVocabularyList = async (): Promise<
  AxiosResponse<VocabularyListResponse>
> => {
  return await axios.get(`${BASE_URL}/api/vocabulary-list`);
};

export const getTags = async (): Promise<AxiosResponse<TagsResponse>> => {
  return await axios.get(`${BASE_URL}/api/tags`);
};
