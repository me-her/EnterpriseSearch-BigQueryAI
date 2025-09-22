# BigQuery AI Competition 2025

A full-stack application for BQ Competition 2025 featuring  AI agents (ADK), React frontend, and BigQuery Storage for SEC filings analysis and contract processing.

## Overview

This project analyzes SEC contract data using BigQuery's AI/ML capabilities to transform unstructured contract documents into structured, queryable insights. Which includes ObjectRefs to enable AI Functions on the Fly. 

### Dataset

The project uses the [Material Contract Corpus](https://mcc.law.stanford.edu/download/contracts/) from Stanford University - a comprehensive dataset containing over 1M contract documents from 2000-2023, with a focus on 2020-2023 data (130k+ documents). The dataset has been uploaded to Google Cloud Storage for processing.

### Data Processing Pipeline

1. **Ingestion** (`src/ingestion/`): Contract documents with a subset of 2020/Q1 documents were processed using Google's Gemini AI to extract structured data including company names, contract types, governing law, parties involved, and key clauses.
   - `extraction.py`: Main extraction script that processes files from Google Cloud Storage
   - `contract_schema.py`: Defines the Pydantic models and BigQuery schema for extracted contract data

2. **BigQuery Storage**: Extracted data is stored in BigQuery tables with a comprehensive schema supporting advanced analytics and AI-powered querying.

3. **AI/ML Integration**: The system leverages BigQuery's built-in AI functions (`AI.GENERATE`, `AI.GENERATE_TABLE`) for intelligent contract analysis and natural language querying.
   - `notebooks/BQ-MCC-EXPLORATION.ipynb`: Exploration on how to use BigQuery AI/ML capabilities
   - `notebooks/objectRef.ipynb`: Shows how to include multimodal analysis with BigQuery object referencing and AI/ML integration

### Components

- **Notebooks** (`notebooks/`): Interactive Jupyter notebooks demonstrating BigQuery AI/ML capabilities
  - `BQ-MCC-EXPLORATION.ipynb`: Explores the Material Contract Corpus data and BigQuery AI/ML features
  - `objectRef.ipynb`: Advanced BigQuery object referencing and AI/ML integration examples

- **Agents** (`agents/`): Python-based agents for intelligent contract analysis
  - `main.py`: FAST API app which exposes SEC Agent that queries BigQuery data using AI/ML functions and BigQuery Toolset.

- **Web App** (`app/`): React-based frontend for interacting with AI agents
  - `src/components/ChatMessage.tsx`: Chat message display component
  - `src/services/chatApi.ts`: API service for communicating with backend agents

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
GOOGLE_CLOUD_LOCATION='your-project-location'
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
│    
├── pyproject.toml
├── uv.lock
└── README.md
```
