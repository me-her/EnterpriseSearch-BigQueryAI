# BQ Competition 2025

A full-stack application for BQ Competition 2025 featuring Python agents, React frontend, and Google AI/Cloud integration for SEC filings analysis and contract processing.

## Installation

This project uses [uv](https://github.com/astral-sh/uv) for fast Python package management.

### Prerequisites
- Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`

### Setup
```bash
# Create virtual environment and install dependencies
uv sync

# Activate the virtual environment
source .venv/bin/activate  # On Unix/macOS
# or
.venv\Scripts\activate     # On Windows
```

### Development Setup
```bash
# Install development dependencies
uv sync --group dev

# Install documentation dependencies
uv sync --group docs
```

## Usage

Add your Google Cloud credentials and API keys to a `.env` file:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GOOGLE_API_KEY=your-gemini-api-key
```

## Project Structure

```
├── agents/
│   ├── main.py
│   └── sec-filings/
│       ├── agent.py
│       └── prompts/
│           └── root_agent_prompt.py
├── app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ChatMessage.tsx
│   │   ├── services/
│   │   │   └── chatApi.ts
│   │   ├── types/
│   │   │   └── chat.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── notebooks/
│   ├── BQ-MCC-EXPLORATION.ipynb
│   ├── ObjectRef.ipynb
│   └── examples/
│       ├── analyze_multimodal_data_bigquery.ipynb
│       └── bigquery_generative_ai_intro.ipynb
├── src/
│   └── ingestion/
│       ├── extraction.py
│       ├── contract_schema.py
│       └── README.md
├── pyproject.toml
├── uv.lock
└── README.md
```
