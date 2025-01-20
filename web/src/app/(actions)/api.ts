import axios from "axios";

export const translate = async (inputWord: string) =>
  await axios.post("http://localhost:6001/api/translate", {
    text: inputWord, // リクエストボディ
  });

export const textToSpeech = async (textData: string) =>
  await axios.post("http://localhost:6001/api/text-to-speech", {
    text: textData, // リクエストボディ
  });
