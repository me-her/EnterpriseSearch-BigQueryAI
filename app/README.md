# SEC Filings Assistant Frontend

A React TypeScript frontend for the BQ Competition 2025 project - an AI-powered SEC filings and contracts analysis application.

## Overview

This frontend provides a chat interface to interact with an AI agent that can query and analyze SEC contract data stored in BigQuery. The application uses BigQuery's AI/ML capabilities to transform unstructured contract documents into structured, queryable data.

## Features

- **Interactive Chat Interface**: Clean, modern UI for natural language queries about SEC filings
- **Real-time Responses**: Live streaming of AI agent responses and BigQuery query execution
- **Contract Analysis**: Query contracts by company, type, governing law, and other attributes
- **AI-Powered Insights**: Uses BigQuery's AI.GENERATE functions for intelligent contract analysis

## Technology Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Markdown** for formatted responses

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- The backend Python API running (see main project README)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## API Integration

The frontend communicates with the Python backend API that provides:
- Chat sessions with the SEC filings agent
- BigQuery integration with AI capabilities
- Contract data analysis and querying

## Data Source

The application analyzes contracts from the [Material Contract Corpus](https://mcc.law.stanford.edu/download/contracts/) - a publicly available dataset from Stanford University containing over 1M contract documents from 2000-2023, with a focus on 2020-2023 data (130k+ documents).

## Project Structure

```
src/
├── components/
│   ├── ChatContainer.tsx    # Main chat interface
│   ├── ChatInput.tsx        # Message input component
│   └── ChatMessage.tsx      # Message display component
├── services/
│   └── chatApi.ts          # API communication
└── types/
    └── chat.ts             # TypeScript type definitions
```
