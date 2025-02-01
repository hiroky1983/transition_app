from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Header, UploadFile
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from google.cloud import storage, speech, texttospeech, translate_v2 as translate
import google.generativeai as genai
from notion_client import Client as NotionClient
import base64
import datetime
import asyncio


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003"],  # 許可するオリジンを指定
    allow_credentials=True,  # Cookieを含むリクエストを許可
    allow_methods=["*"],  # 許可するHTTPメソッド（GET, POSTなど）
    allow_headers=["*"],  # 許可するHTTPヘッダー
)

# load env
load_dotenv()
project_id = os.getenv("GOOGLE_PROJECT_ID")
gemini_api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
notion_api_key = os.getenv("NOTION_API_KEY")
notion_database_id = os.getenv("NOTION_DATABASE_ID")

genai.configure(api_key=gemini_api_key)


# Instantiates a client
speech_client = speech.SpeechClient()
text_client = texttospeech.TextToSpeechClient()
translate_client = translate.Client()
notion_client = NotionClient(auth=notion_api_key)
storage_client = storage.Client(project=project_id)
# リクエストボディのモデル定義
class TranslationRequest(BaseModel):
    text: str


# リクエストボディのモデル定義
class TextToSpeechRequest(BaseModel):
    text: str  # 音声に変換するテキスト


# リクエストボディのモデル
class SpeechToTextRequest(BaseModel):
    audio: UploadFile  # 音声ファイル　〇〇.wav


class GeminiRequest(BaseModel):
    text: str

class NotionRequest(BaseModel):
    title: str
    name_ja: str
    genre: str
    audio_content: str

class NotionGetRequest(BaseModel):
    name_ja: str

MAX_ALLOWED_SIZE = 10 * 1024 * 1024  # 10MB in bytes


# ヘルスチェックエンドポイント
@app.get("/")
def health_check():
    return {"status": "OK"}


# 翻訳エンドポイント
@app.post("/api/translate")
def translate(request: TranslationRequest):
    text = request.text
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    notion_response = notion_client.databases.query(
        database_id=notion_database_id,
        filter={
            "property": "name_ja",
            "rich_text": {
                "contains": text
            }
        }
    )

    if notion_response["results"]:
        return {
            "translatedText": notion_response["results"][0]["properties"]["name_vi"]["title"][0]["text"]["content"],
            "audio": notion_response["results"][0]["properties"]["audio"]["files"][0]["external"]["url"],
            "tag": notion_response["results"][0]["properties"]["tag"]["multi_select"][0]["name"],
            "name_ja": notion_response["results"][0]["properties"]["name_ja"]["rich_text"][0]["text"]["content"]
        }

    target_language = "vi"  # ベトナム語を固定

    response = translate_client.translate(text, target_language)

    translated_text = response["translatedText"]
    return {"translatedText": translated_text}


# Google Text-to-Speech エンドポイント
@app.post("/api/text-to-speech")
def text_to_speech(request: TextToSpeechRequest):
    text = request.text
    language_code = "vi-VN"
    voice_gender = texttospeech.SsmlVoiceGender.MALE
    name = "vi-VN-Wavenet-A"

    # リクエストのペイロードを作成
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code=language_code, name=name, ssml_gender=voice_gender
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=1,
        pitch=0,
        volume_gain_db=0,
    )

    # Google Text-to-Speech APIを呼び出す
    response = text_client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    if response.audio_content:
        # Base64エンコード
        audio_content_base64 = base64.b64encode(response.audio_content).decode("utf-8")
        return {"audioContent": audio_content_base64}
    else:
        raise HTTPException(status_code=500, detail="No audio content in response")


@app.post("/api/speech-to-text")
async def speech_to_text(audio: UploadFile):
    """
    音声データをテキストに変換するエンドポイント。
    :param audio: UploadFile (音声データ)
    :return: 音声認識の結果
    """
    try:
        # 音声データを読み込む
        audio_data = await audio.read()
        # データサイズを検証
        if len(audio_data) > MAX_ALLOWED_SIZE:
            raise HTTPException(status_code=400, detail="Audio data too large")

        # RecognitionAudio オブジェクトを作成
        audio_content = speech.RecognitionAudio(content=audio_data)
        # RecognitionConfig を設定
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.ENCODING_UNSPECIFIED,
            sample_rate_hertz=48000,
            language_code="vi-VN",
        )

        # Google Cloud Speech-to-Text API を呼び出す
        response = speech_client.recognize(config=config, audio=audio_content)
        print(response.results)
        # トランスクリプトを抽出
        transcripts = [result.alternatives[0].transcript for result in response.results]

        # トランスクリプトが空の場合のエラーハンドリング
        if not transcripts:
            raise HTTPException(status_code=400, detail="No transcription available")

        return {"transcripts": transcripts}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/gemini")
def gemini(request: GeminiRequest):
    gemini_pro = genai.GenerativeModel("gemini-1.5-flash")
    prompt = request.text + ", Please talk in Vietnamese to the above words"
    response = gemini_pro.generate_content(prompt)
    return {"text": response.text}

@app.post("/api/create-notion")
async def create_notion(request: NotionRequest):
        # Cloud Storageのバケット取得
        bucket = storage_client.bucket("ai-project-443214-audio")
        
        # Base64デコード
        audio_data = base64.b64decode(request.audio_content)
        
        # ファイル名を生成（タイムスタンプを使用して一意にする）
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        blob_name = f"audio_{timestamp}.wav"
        blob = bucket.blob(blob_name)
        
        # メモリからデータをアップロード
        blob.upload_from_string(audio_data, content_type="audio/wav")
        
        # 署名付きURLを生成（15分間有効）
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="GET"
        )

        response = notion_client.pages.create(
            **{
                "parent": {
                    "database_id": notion_database_id
                },
                "properties": {
                    "name_vi": {
                        "title": [
                            {
                                "text": {
                                    "content": request.title
                                }
                            }
                        ]
                    },
                    "name_ja": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": request.name_ja
                                }
                            }
                        ]
                    },
                    "tag": {
                        "multi_select": [
                            {
                                "name": request.genre
                            }
                        ]
                    },
                    "audio": {
                        "files": [
                            {
                                "name": blob_name,
                                "external": {
                                    "url": url
                                }
                            }
                        ]
                    }
                }
            }
        )
        return {"status": "OK", "response": response}

# 実行用エントリポイント（uvicornを利用することを想定）
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=6001, reload=True)
