from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import base64
from fastapi import FastAPI, HTTPException, Header, File, UploadFile
from pydantic import BaseModel
import google.auth
import google.auth.transport.requests
import os
from dotenv import load_dotenv
from google.cloud import speech
import google.generativeai as genai

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003"],  # 許可するオリジンを指定
    allow_credentials=True,                  # Cookieを含むリクエストを許可
    allow_methods=["*"],                     # 許可するHTTPメソッド（GET, POSTなど）
    allow_headers=["*"],                     # 許可するHTTPヘッダー
)

# Instantiates a client
client = speech.SpeechClient()

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

load_dotenv()
project_id = os.getenv('GOOGLE_PROJECT_ID')
gemini_api_key = os.getenv('GOOGLE_GEMINI_API_KEY')

genai.configure(api_key=gemini_api_key)

MAX_ALLOWED_SIZE = 10 * 1024 * 1024  # 10MB in bytes

# トークン取得用の関数
@app.get("/api/get-access-token")
def get_access_token():
    credentials, _your_project_id = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req) #refresh token
    return {"token": credentials.token}

# ヘルスチェックエンドポイント
@app.get("/")
def health_check():
    return {"status": "OK"}

# 翻訳エンドポイント
@app.post("/api/translate")
def translate(request: TranslationRequest,     authorization: str = Header(None),  # Authorizationヘッダーを取得
):
    text = request.text
    source_language = 'ja'  # 日本語を固定
    target_language = 'vi'  # ベトナム語を固定

    # Google Translation APIを呼び出す
    access_token = authorization.split(" ")[1]
    if not access_token:
        raise HTTPException(status_code=500, detail="Unable to retrieve access token")

    url = "https://translation.googleapis.com/language/translate/v2"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-goog-user-project": project_id,
        "Content-Type": "application/json; charset=utf-8"
    }

    payload = {
        "q": text,
        "source": source_language,
        "target": target_language,
        "format": "text"
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))
    if response.status_code == 200:
        translated_text = response.json().get("data", {}).get("translations", [])[0].get("translatedText")
        return {"translatedText": translated_text}
    else:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    
# Google Text-to-Speech エンドポイント
@app.post("/api/text-to-speech")
def text_to_speech(
    request: TextToSpeechRequest,
    authorization: str = Header(None),  # Authorization ヘッダーを取得
):
    # アクセストークンを取得
    access_token = authorization.split(" ")[1]
    if not access_token:
        raise HTTPException(status_code=500, detail="Unable to retrieve access token")

    # Google Text-to-Speech APIのリクエストURLとヘッダー
    url = "https://texttospeech.googleapis.com/v1/text:synthesize"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=utf-8",
        "x-goog-user-project": project_id
    }

    text = request.text
    language_code =  "vi-VN"
    voice_gender = "MALE"
    name = "vi-VN-Wavenet-A"
    # ペイロードの作成
    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": language_code,
            "name": name,
            "ssmlGender": voice_gender
        },
        "audioConfig": {  
            "audioEncoding": "MP3",
            "speakingRate": 1,
            "pitch": 0,
            "volumeGainDb": 0
            }
        }

    # Google Text-to-Speech APIを呼び出す
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    if response.status_code == 200:
        audio_content = response.json().get("audioContent")
        if audio_content:
            return {"audioContent": audio_content}
        else:
            raise HTTPException(status_code=500, detail="No audio content in response")
    else:
        raise HTTPException(status_code=response.status_code, detail=response.text)


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
        response = client.recognize(config=config, audio=audio_content)
        print(response.results)
        # トランスクリプトを抽出
        transcripts = [
            result.alternatives[0].transcript for result in response.results
        ]

        # トランスクリプトが空の場合のエラーハンドリング
        if not transcripts:
            raise HTTPException(status_code=400, detail="No transcription available")

        return {"transcripts": transcripts}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
@app.post("/api/gemini")
def gemini(request: GeminiRequest):
    print(request)
    gemini_pro = genai.GenerativeModel("gemini-1.5-flash")
    prompt = request.text + ", Please reply in Vietnamese to the above words"
    response = gemini_pro.generate_content(prompt)
    return {"text": response.text}

# 実行用エントリポイント（uvicornを利用することを想定）
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=6001, reload=True)
