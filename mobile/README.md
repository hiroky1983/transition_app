# Transition App Mobile

React Native mobile application for Japanese-Vietnamese translation and vocabulary learning.

## Features

- **Translation**: Translate Japanese words to Vietnamese
- **Vocabulary**: Browse and search saved vocabulary
- **Conversation**: Practice conversation with AI

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Run on specific platform:
   ```bash
   npm run ios     # iOS simulator
   npm run android # Android emulator
   npm run web     # Web browser
   ```

## Project Structure

```
mobile/
├── src/
│   ├── screens/          # Screen components
│   └── services/         # API services
├── assets/               # Images and icons
├── App.tsx              # Main app component
├── index.ts             # Entry point
└── package.json         # Dependencies
```

## Configuration

Update the `BASE_URL` in `src/services/api.ts` to point to your backend server.
