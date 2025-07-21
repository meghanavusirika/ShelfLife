# ShelfLife - Smart Kitchen Pantry Management

A smart kitchen pantry management app that helps reduce food waste through AI-powered recipe suggestions and receipt scanning.

# 🌐 Live Demo

Check out the deployed application:
🔗 https://shelflife-4dr7.onrender.com

# Preview

![Recipe_Page](https://github.com/user-attachments/assets/02e0edd9-184e-49dd-bf56-e57b45f56180)
![Home_Page](https://github.com/user-attachments/assets/5be83121-4e9d-4b17-80a6-46a0d88f77e6)
![Recipe_Suggestions](https://github.com/user-attachments/assets/3305ab80-9797-415a-99b8-0a18f6d0d067)


## Features

- 🥬 **Smart Pantry Management**: Track food items with expiry dates
- 📸 **Receipt Scanning**: AI-powered OCR with Veryfi + Ollama (Llama2) integration
- 🤖 **Recipe Suggestions**: Personalized recipes based on expiring items
- ❄️ **Freeze Functionality**: Extend shelf life of appropriate items
- 📊 **Analytics Dashboard**: Track food waste and savings
- 🎨 **Multiple Themes**: Customizable UI themes

## Tech Stack

- **Frontend**: React + TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js + Express, MongoDB
- **AI Integration**: Ollama (Llama2) for recipes and food standardization
- **OCR**: Veryfi API (primary) with Tesseract fallback

## ⚙️ Local Setup Instructions
The steps below are for developers who want to run SustainIQ locally for development or contribution purposes.

### 1. Environment Variables

Copy the example environment file and configure your secrets:

```bash
cp env.example .env
```

Edit the `.env` file with your actual credentials:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=YourApp

# Veryfi API Configuration (for receipt scanning)
VERYFI_CLIENT_ID=your_veryfi_client_id
VERYFI_API_KEY=your_veryfi_api_key

# Server Configuration
PORT=3001
VERYFI_PROXY_PORT=3002
```

### 2. Get API Keys

#### MongoDB Atlas
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string and replace credentials in `MONGODB_URI`

#### Veryfi API (Receipt Scanning)
1. Sign up at [Veryfi](https://app.veryfi.com/auth/register/?ref=header)
2. Get your Client ID and API Key from dashboard
3. Add to `VERYFI_CLIENT_ID` and `VERYFI_API_KEY`

#### Google OAuth (Authentication)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized origins: `http://localhost:8080`
6. Add to `VITE_GOOGLE_CLIENT_ID`

### 3. Installation

Install dependencies for all services:

```bash
# Frontend dependencies
npm install

# Backend server dependencies
cd server
npm install
cd ..

# Text parser service dependencies
cd text_parser
npm install
cd ..
```

### 4. Running the Application

Start all services (requires 3 terminals):

**Terminal 1 - Frontend (Port 8080):**
```bash
npm run dev
```

**Terminal 2 - Main Backend (Port 3001):**
```bash
cd server
npm start
```

**Terminal 3 - Veryfi Proxy (Port 3002):**
```bash
cd text_parser
npm start
```

### 5. Access the Application

Open your browser to: `http://localhost:8080`

## Security Notes

⚠️ **Important**: Never commit the `.env` file to version control. It contains sensitive API keys and database credentials.

The `.env` file is already included in `.gitignore` to prevent accidental commits.

## Architecture

- **Frontend**: React app running on port 8080
- **Main Backend**: Express server on port 3001 (handles auth, pantry, recipes)
- **Veryfi Proxy**: Express server on port 3002 (handles receipt OCR)
- **Database**: MongoDB for user data, pantry items, and recipes
- **AI Services**: Ollama (Llama2) for recipe generation and food name standardization

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make sure to add your own `.env` file (never commit it)
4. Test your changes
5. Submit a pull request

## Contributors for Submission to Spurhacks 2025
- [@JordanKing22](https://github.com/JordanKing22) – Project Lead & Backend  
- [@meghanavusirika](https://github.com/meghanavusirika) – Frontend Developer and Designer
- [@manahilbashir](https://github.com/manahilbashir) – UX/UI Designer
- [@PritNotPrinter](https://github.com/PritNotPrinter) - Pitch Lead and OCR Integration
## License

MIT License
