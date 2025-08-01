# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese-Vietnamese vocabulary learning application with three main components:
- **Frontend (web/)**: Next.js 15 app with TypeScript and Tailwind CSS
- **Backend (server/)**: FastAPI Python server with Google Cloud services integration
- **Infrastructure (infra/)**: Terraform configuration for cloud resources

The application allows users to translate Japanese words to Vietnamese, generate audio pronunciations, and store vocabulary in a Notion database for future reference.

## Development Commands

### Frontend (web/ directory)
```bash
cd web
npm run dev          # Start development server with Turbo (localhost:3000 default)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Backend (server/ directory)
```bash
cd server
poetry install       # Install dependencies
poetry run python main.py  # Start FastAPI server on port 6001
poetry run ruff check      # Run linting
poetry run ruff format     # Format code
```

### Docker Development
```bash
docker-compose up    # Start server container on port 6001
```

## Architecture

### Backend Services Architecture
The server follows a service-oriented architecture with two main service classes:

**GoogleCloudService** (`server/services/google_cloud.py`):
- Text translation (Japanese → Vietnamese) 
- Text-to-speech synthesis (Vietnamese audio)
- Speech-to-text recognition
- Gemini AI integration for conversational responses
- Google Cloud Storage for audio file storage

**NotionService** (`server/services/notion.py`):
- Database queries to check for existing vocabulary
- Page creation for new vocabulary entries
- Data retrieval with audio, tags, and translations

### API Endpoints
- `POST /api/translate` - Translates text, checks Notion cache first
- `POST /api/text-to-speech` - Converts Vietnamese text to audio
- `POST /api/speech-to-text` - Converts audio to text
- `POST /api/gemini` - Generates conversational responses
- `POST /api/create-notion` - Stores vocabulary in Notion database

### Frontend Architecture
- **page.tsx**: Server component that checks backend health
- **Client.tsx**: Main client component handling translation workflow
- **api.ts**: Axios-based API client functions
- **UI Components**: Radix UI primitives with Tailwind styling

### Data Flow
1. User enters Japanese word
2. Frontend calls `/api/translate` 
3. Backend checks Notion database for existing entry
4. If not found, translates via Google Translate API
5. Generates Vietnamese audio via Google Text-to-Speech
6. User can save to Notion database with tags

## Environment Variables Required

### Server (.env in server/ directory)
```
GOOGLE_PROJECT_ID=your-gcp-project-id
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
NOTION_API_KEY=your-notion-integration-key
NOTION_DATABASE_ID=your-notion-database-id
GOOGLE_APPLICATION_CREDENTIALS=./certificates/certificates.json
```

## Key Dependencies

### Frontend
- Next.js 15 with React 19
- Radix UI components for accessible UI
- Tailwind CSS for styling
- Axios for API communication

### Backend  
- FastAPI for API framework
- Google Cloud client libraries (Speech, Text-to-Speech, Translate, Storage)
- Notion client for database integration
- Google Generative AI (Gemini) for conversational features

## Testing and Quality
Run linting before committing changes:
```bash
# Frontend
cd web && npm run lint

# Backend  
cd server && poetry run ruff check
```