from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Header, UploadFile
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import base64
from services.google_cloud import GoogleCloudService
from services.notion import NotionService

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3003"],  # 許可するオリジンを指定
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

# Initialize services
google_service = GoogleCloudService(project_id, gemini_api_key)
notion_service = NotionService(notion_api_key, notion_database_id)

# Constants
MAX_ALLOWED_SIZE = 10 * 1024 * 1024  # 10MB in bytes
BUCKET_NAME = "ai-project-443214-audio"

# Request Models
class TranslationRequest(BaseModel):
    text: str

class TextToSpeechRequest(BaseModel):
    translatedText: str  # 音声に変換するテキスト

class GeminiRequest(BaseModel):
    text: str

class NotionRequest(BaseModel):
    title: str
    name_ja: str
    tags: list[str]  # Changed from genre to tags array

class NotionGetRequest(BaseModel):
    name_ja: str

# ヘルスチェックエンドポイント
@app.get("/")
def health_check():
    return {"status": "OK"}

# 翻訳エンドポイント
@app.post("/api/translate")
async def translate(request: TranslationRequest):
    notion_result = notion_service.search_by_name(request.text)
    if notion_result:
        return notion_result
    
    return google_service.translate_text(request.text)

# Google Text-to-Speech エンドポイント
@app.post("/api/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    return google_service.text_to_speech(request.translatedText)

@app.post("/api/speech-to-text")
async def speech_to_text(audio: UploadFile):
    """
    音声データをテキストに変換するエンドポイント。
    :param audio: UploadFile (音声データ)
    :return: 音声認識の結果
    """
    audio_data = await audio.read()
    return await google_service.speech_to_text(audio_data, MAX_ALLOWED_SIZE)

@app.post("/api/gemini")
async def gemini(request: GeminiRequest):
    return google_service.generate_gemini_response(request.text)

@app.get("/api/vocabulary-list")
async def get_vocabulary_list():
    """単語帳一覧を取得するエンドポイント"""
    try:
        result = notion_service.get_all_vocabulary()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tags")
async def get_tags():
    """既存のタグ一覧を取得するエンドポイント"""
    try:
        result = notion_service.get_all_tags()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create-notion")
async def create_notion(request: NotionRequest):
    try:
        # Create Notion page without audio
        response = notion_service.create_page(
            request.title,
            request.name_ja,
            request.genre
        )
        
        return {"status": "OK", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 実行用エントリポイント（uvicornを利用することを想定）
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=6001, reload=True)
