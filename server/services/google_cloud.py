from google.cloud import storage, speech, texttospeech, translate_v2 as translate
import google.generativeai as genai
import base64
import datetime
from typing import Dict, Any

class GoogleCloudService:
    def __init__(self, project_id: str, gemini_api_key: str):
        # Configure Gemini
        genai.configure(api_key=gemini_api_key)

        # Initialize clients
        self.speech_client = speech.SpeechClient()
        self.text_client = texttospeech.TextToSpeechClient()
        self.translate_client = translate.Client()
        self.storage_client = storage.Client(project=project_id)
        self.gemini = genai.GenerativeModel("gemini-1.5-flash")

    def translate_text(self, text: str) -> Dict[str, str]:
        target_language = "vi"
        response = self.translate_client.translate(text, target_language)
        return {"translatedText": response["translatedText"]}

    def text_to_speech(self, text: str) -> Dict[str, str]:
        language_code = "vi-VN"
        voice_gender = texttospeech.SsmlVoiceGender.MALE
        name = "vi-VN-Wavenet-A"

        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=name,
            ssml_gender=voice_gender
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1,
            pitch=0,
            volume_gain_db=0,
        )

        response = self.text_client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )

        if response.audio_content:
            audio_content_base64 = base64.b64encode(response.audio_content).decode("utf-8")
            return {"audioContent": audio_content_base64}
        return {"error": "No audio content in response"}

    async def speech_to_text(self, audio_data: bytes, max_size: int) -> Dict[str, Any]:
        if len(audio_data) > max_size:
            return {"error": "Audio data too large"}

        audio_content = speech.RecognitionAudio(content=audio_data)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.ENCODING_UNSPECIFIED,
            sample_rate_hertz=48000,
            language_code="vi-VN",
        )

        response = self.speech_client.recognize(config=config, audio=audio_content)
        transcripts = [result.alternatives[0].transcript for result in response.results]

        if not transcripts:
            return {"error": "No transcription available"}

        return {"transcripts": transcripts}

    def generate_gemini_response(self, text: str) -> Dict[str, str]:
        prompt = text + ", Please talk in Vietnamese to the above words"
        response = self.gemini.generate_content(prompt)
        return {"text": response.text}

    def upload_audio_to_storage(self, audio_data: bytes, bucket_name: str) -> Dict[str, str]:
        bucket = self.storage_client.bucket(bucket_name)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        blob_name = f"audio_{timestamp}.wav"
        blob = bucket.blob(blob_name)
        
        blob.upload_from_string(audio_data, content_type="audio/wav")
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(days=7),
            method="GET"
        )
        
        return {
            "url": url,
            "blob_name": blob_name
        } 