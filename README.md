# ScholarMind AI: Intelligent Academic Matching & Recommendation Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter&logoColor=white)](https://flutter.dev/)
[![Dart](https://img.shields.io/badge/Dart-3.x-0175C2?logo=dart&logoColor=white)](https://dart.dev/)
[![Google Gemini API](https://img.shields.io/badge/Google%20Gemini-Pro%20%7C%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Challenge](https://img.shields.io/badge/Google%20AI-Seek%20Builders%20Challenge-34A853?logo=googlecloud&logoColor=white)](https://buildwithai.google/)

An intelligent, cross-platform academic guidance and multi-factor recommendation engine developed for the **Google AI Seek Builders Challenge (`#BuildWithAI`)**.

---

## 📌 Project Overview

**ScholarMind AI** is an end-to-end intelligent guidance ecosystem engineered to eliminate academic mismatch and optimize higher education pathways. Traditional academic portals rely on rigid, keyword-based search queries that fail to evaluate the nuanced intersection of a student's GPA, technical skillset, research trajectory, and institutional admission requirements.

ScholarMind AI solves this by integrating **Large Language Model (LLM) semantic reasoning** via the **Google Gemini API** with multi-factor recommendation pipelines, vector matching heuristics, and a responsive **Flutter** cross-platform client backed by **Firebase**.

* **Developer:** [Hasnain Yasin](https://github.com/hasnainyasin900)
* **Initiative:** Google AI Seek Builders Challenge (`#BuildWithAI`)
* **Core Focus:** Applied Artificial Intelligence, NLP, Recommender Systems & Educational Technology

---

## 🚀 Key Features

### 1. Multi-Factor Semantic Matching Engine
* Evaluates complex applicant profiles (GPA, research interests, programming languages, previous coursework, budget, geographic preference) against multi-tier university and faculty datasets.
* Employs hybrid scoring: combines weighted quantitative thresholds with LLM contextual reasoning to generate ranked recommendation tiers.

### 2. Intelligent Advising with Google Gemini
* Powered by Google's **Gemini API** for contextual, conversational academic advising and natural language question answering.
* Automated Statement of Purpose (SOP) and research proposal critiquing, identifying structural gaps and suggesting domain-specific alignment.
* Real-time query decomposition transforming ambiguous student aspirations into structured research domains.

### 3. Automated Skill Profiling & Assessment
* Interactive diagnostic quizzes evaluating foundational computing, algorithmic, and mathematical proficiencies.
* Dynamic feedback generator producing personalized learning roadmaps based on identified knowledge gaps.

### 4. Enterprise-Grade Cloud Architecture
* **Firebase Authentication:** Secure email/password and federated Google OAuth sign-in workflows.
* **Cloud Firestore:** Real-time NoSQL schema storing user profile state, assessment logs, and personalized matching histories.
* **Serverless Backend:** Secure API key encapsulation and heavy prompt orchestration mediated through serverless middleware functions.

---

## 🛠️ System Architecture

```text
+-------------------------------------------------------------------------+
|                        Presentation Layer (Client)                      |
|             Flutter (Dart) • Cross-Platform (Android / iOS / Web)       |
|             State Management (Provider / BLoC) • Clean UI/UX            |
+-------------------------------------------------------------------------+
                                     │
                        Secure REST / gRPC Requests
                                     ▼
+-------------------------------------------------------------------------+
|                         Cloud & Logic Layer                             |
|          Firebase Auth • Cloud Functions • Serverless Gateway           |
+-------------------------------------------------------------------------+
                 │                                        │
      Prompt Orchestration & AI               Structured Data Storage
                 ▼                                        ▼
+------------------------------------+   +--------------------------------+
|       Google Gemini AI Engine      |   |       Cloud Firestore NoSQL    |
|   Gemini Pro / Flash Model APIs    |   |   Profiles • Benchmarks • Logs |
| Context Reasoning & Recommendation |   |  Atomic Transactions & Caching |
+------------------------------------+   +--------------------------------+
```

---

## 📂 Project Directory Structure

```bash
scholarmind-ai/
│
├── android/                   # Native Android wrapper and manifest configurations
├── ios/                       # Native iOS project bindings
├── assets/
│   ├── icons/                 # Application SVG icons and vector badges
│   └── images/                # UI graphics and brand illustrations
│
├── lib/
│   ├── core/                  # Global utilities, theme definitions, and network clients
│   │   ├── constants/         # App constants, API endpoints, styling keys
│   │   └── utils/             # Data validators, formatters, and error handlers
│   │
│   ├── models/                # Typed data models and JSON serialization
│   │   ├── student_profile.dart
│   │   ├── recommendation_result.dart
│   │   └── assessment_quiz.dart
│   │
│   ├── services/              # External service integrations
│   │   ├── gemini_ai_service.dart     # Google Gemini API prompt chaining & client
│   │   ├── auth_service.dart          # Firebase authentication controller
│   │   └── firestore_service.dart     # Firestore CRUD and real-time listeners
│   │
│   ├── controllers/           # Application state management controllers
│   │   ├── advisor_controller.dart
│   │   └── matching_controller.dart
│   │
│   ├── views/                 # Presentation widgets and modular screen layouts
│   │   ├── auth/              # Login, registration, and onboarding screens
│   │   ├── dashboard/         # Main navigation hub and profile telemetry
│   │   ├── advisor/           # AI interactive chat and consultation views
│   │   └── recommendations/   # Ranked matching cards and analytics breakdown
│   │
│   └── main.dart              # Application entry point and service bootstrap
│
├── test/                      # Unit, widget, and integration test suites
├── pubspec.yaml               # Flutter package dependencies and environment SDK
├── README.md                  # Project documentation
└── LICENSE                    # Open-source MIT License
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
* [Flutter SDK](https://docs.flutter.dev/get-started/install) (Version 3.19.x or higher)
* [Dart SDK](https://dart.dev/get-dart) (Version 3.3.x or higher)
* Android Studio / VS Code with Flutter extensions installed
* Active [Google AI Studio API Key](https://aistudio.google.com/) (Gemini API)
* Active Firebase project with Firestore and Authentication enabled

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/hasnainyasin900/scholarmind-ai.git
   cd scholarmind-ai
   ```

2. **Install Flutter Dependencies**
   ```bash
   flutter pub get
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the project root directory and add your Google Gemini credentials:
   ```env
   GEMINI_API_KEY=your_actual_google_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-pro-latest
   ```

4. **Configure Firebase**
   * Download and place `google-services.json` into `android/app/`.
   * For iOS, place `GoogleService-Info.plist` into `ios/Runner/`.
   * Alternatively, configure using FlutterFire CLI:
     ```bash
     flutterfire configure
     ```

5. **Run the Application**
   ```bash
   flutter run
   ```

---

## 🔮 Research Directions & Future Enhancements

* **RAG Knowledge Graph Integration:** Connecting dense vector embeddings with structured university ontologies via Neo4j / Pinecone for verifiable citation and zero hallucination.
* **Multimodal Document Processing:** Enabling direct PDF upload of transcripts, degree certificates, and publications for automatic feature extraction via Gemini 1.5 Multimodal APIs.
* **Edge-Deployable LLM Quantization:** Integrating on-device quantized models (Gemma / MediaPipe) for offline student advising without recurring cloud inference costs.
* **Fairness & Bias Mitigation:** Auditing recommendation algorithms to prevent historical demographic and institutional selection biases in scholarship matching.

---

## 📜 Academic Attribution & Citation

If you reference the architecture, models, or algorithms of **ScholarMind AI** in your academic research or literature, please cite:

```bibtex
@misc{yasin2024scholarmind,
  author       = {Hasnain Yasin},
  title        = {ScholarMind AI: Intelligent Academic Matching and Career Recommendation Engine},
  howpublished = {Google AI Seek Builders Challenge (\#BuildWithAI)},
  year         = {2024},
  url          = {https://github.com/hasnainyasin900/scholarmind-ai}
}
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Hasnain Yasin**
* **Role:** Lead Mobile Developer @ Beatix Studio | Creator of ScholarMind AI
* **Education:** BS in Computer Science, The Islamia University of Bahawalpur (HEC Attested)
* **GitHub:** [@hasnainyasin900](https://github.com/hasnainyasin900)
* **LinkedIn:** [Hasnain Yasin](https://linkedin.com/in/hasnainyasin)
* **Email:** [hasnainyasin02@gmail.com](mailto:hasnainyasin02@gmail.com)
