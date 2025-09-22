# Contract Extraction and BigQuery Ingestion

Modern contract extraction system that processes files from Google Cloud Storage (GCS), extracts structured data using Google's Gemini AI, and ingests the results into BigQuery using a YAML manifest-based approach.

## Features

- ✅ **YAML Manifest**: Generate and use YAML manifests for organized file processing
- ✅ **Direct GCS Processing**: No file downloads - processes files directly from GCS URIs
- ✅ **Asynchronous Processing**: Fast concurrent processing with configurable workers
- ✅ **VertexAI Integration**: Uses Google's Gemini 2.0 Flash via VertexAI for intelligent contract extraction
- ✅ **BigQuery Integration**: Automatic table creation and batch insertion
- ✅ **Clean Architecture**: Single script with environment variable configuration
- ✅ **Error Handling**: Comprehensive logging and failed file tracking
- ✅ **Progress Tracking**: Real-time progress bars and detailed metrics

## Prerequisites

1. **Google Cloud Project** with:
   - BigQuery API enabled
   - Cloud Storage API enabled
   - Gemini AI API access

2. **Python Dependencies** (already in pyproject.toml):
   - google-cloud-storage
   - google-cloud-bigquery
   - google-generativeai
   - langchain
   - pydantic
   - tqdm
   - pyyaml

3. **Required Environment Variables**:
   ```bash
   export GOOGLE_CLOUD_PROJECT="your-project-id"
   export GCS_BUCKET_NAME="your-bucket-name"
   ```

## Setup

1. **Install dependencies**:
   ```bash
   uv sync
   ```

2. **Set environment variables**:
   ```bash
   export GOOGLE_CLOUD_PROJECT="your-project-id"
   export GCS_BUCKET_NAME="your-bucket-name"
   ```

3. **Configure optional settings** (optional):
   ```bash
   export GOOGLE_CLOUD_LOCATION="us-central1"        # Default: us-central1
   export GCS_PREFIX="production_contracts/"          # Default: production_contracts/
   export BQ_DATASET="contracts"                      # Default: contracts
   export BQ_TABLE="extracted_contracts"              # Default: extracted_contracts
   export GEMINI_MODEL_NAME="gemini-2.0-flash-exp"   # Default: gemini-2.0-flash-exp
   ```

## Usage

### Generate Manifest and Process

```bash
cd src/ingestion
python extract_contracts.py --generate-manifest --workers 20 --batch-size 100
```

### Process from Existing Manifest

```bash
cd src/ingestion
python extract_contracts.py --manifest contracts_manifest.yaml --workers 10 --batch-size 50
```

### Generate Manifest Only

```bash
cd src/ingestion
python extract_contracts.py --generate-manifest --output-manifest my_contracts.yaml
```

### Command Line Options

- `--workers N`: Number of concurrent workers (default: 20)
- `--batch-size N`: BigQuery batch insert size (default: 100)
- `--generate-manifest`: Generate YAML manifest from GCS
- `--manifest FILE`: Use existing YAML manifest file
- `--output-manifest FILE`: Output manifest file name (default: contracts_manifest.yaml)

## BigQuery Schema

The system creates a BigQuery table with the following schema:

| Field | Type | Mode | Description |
|-------|------|------|-------------|
| contract_id | STRING | REQUIRED | Unique identifier for each contract |
| file_path | STRING | REQUIRED | GCS file path |
| company_name | STRING | NULLABLE | Company name |
| form_type | STRING | NULLABLE | SEC form type (10-K, 8-K, etc.) |
| filing_date | STRING | NULLABLE | Filing date (YYYY-MM-DD) |
| state_incorp | STRING | NULLABLE | State of incorporation |
| contract_type | STRING | NULLABLE | Contract type |
| contract_date | STRING | NULLABLE | Contract execution date |
| governing_law_state | STRING | NULLABLE | Governing law state |
| contract_summary | STRING | NULLABLE | AI-generated summary |
| numeric_value | FLOAT | NULLABLE | Contract value |
| parties | STRING | REPEATED | List of parties involved |
| clauses | STRING | REPEATED | List of contract clauses |

## Output Files

- **`contracts_manifest.yaml`**: YAML manifest of all contract files with metadata
- **`contract_extraction.log`**: Detailed processing logs
- **`failed_files.json`**: List of files that failed to process (if any)

## YAML Manifest Structure

The generated YAML manifest contains:

```yaml
metadata:
  generated_at: 1640995200.0
  bucket: your-bucket-name
  prefix: production_contracts/
  total_files: 1250
  file_extensions: ['.htm', '.html', '.pdf', '.txt']

files:
  - file_path: production_contracts/2020/Q1/contract_001.html
    gcs_uri: gs://your-bucket/production_contracts/2020/Q1/contract_001.html
    size_bytes: 45230
    updated: '2023-01-15T10:30:00Z'
    content_type: text/html
```

## Configuration

All settings are configured via environment variables:

- **GOOGLE_CLOUD_PROJECT**: Google Cloud project ID (required)  
- **GCS_BUCKET_NAME**: GCS bucket containing contract files (required)
- **GOOGLE_CLOUD_LOCATION**: GCP region for VertexAI (default: "us-central1")
- **GCS_PREFIX**: Path prefix for contract files (default: "production_contracts/")
- **BQ_DATASET**: BigQuery dataset name (default: "contracts")
- **BQ_TABLE**: BigQuery table name (default: "extracted_contracts")
- **GEMINI_MODEL_NAME**: Gemini model to use (default: "gemini-2.0-flash-exp")

## File Structure

```
src/ingestion/
├── extract_contracts.py           # Main extraction script with YAML manifest support
├── contract_extraction.py         # Pydantic models and prompts
└── README.md                      # This documentation
```

## Performance Notes

- **Direct GCS Processing**: No file downloads - Gemini processes files directly from GCS URIs for maximum efficiency
- **YAML Manifest**: Pre-generates file list with metadata for organized processing
- **VertexAI Integration**: Uses native VertexAI client for optimal performance and authentication
- **Concurrent Processing**: Uses ThreadPoolExecutor for I/O-bound operations  
- **Configurable Workers**: Adjust concurrency based on API limits and performance needs
- **Batch Insertion**: Reduces BigQuery API calls by batching inserts
- **Error Recovery**: Continues processing even if individual files fail

## Troubleshooting

### Common Issues

1. **Authentication**:
   - Ensure you're authenticated with Google Cloud: `gcloud auth application-default login`
   - Or set up service account key: `export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"`

2. **BigQuery Permissions**:
   - Ensure service account has BigQuery Editor role
   - Verify dataset exists or service account can create it

3. **VertexAI Access**:
   - Enable VertexAI API in your project
   - Ensure you have permission to access Gemini models

4. **GCS Access**:
   - Ensure bucket exists and is accessible
   - Check that files match allowed extensions

5. **Rate Limiting**:
   - Gemini API has rate limits; reduce `--workers` parameter
   - BigQuery has quota limits; reduce `--batch-size` parameter

6. **Manifest Issues**:
   - Generate new manifest if GCS contents changed
   - Check manifest file path and permissions

### Logs

Check `contract_extraction.log` for detailed error information:
```bash
tail -f contract_extraction.log
```

### Failed Files

Review `failed_files.json` to see which files failed and why:
```bash
cat failed_files.json | jq '.failed_files[]'
```

### Example Commands

```bash
# Generate manifest only and review
python extract_contracts.py --generate-manifest --output-manifest contracts.yaml
head -20 contracts.yaml

# Process with conservative settings
python extract_contracts.py --manifest contracts.yaml --workers 5 --batch-size 20
```

## Monitoring

The system provides real-time progress tracking:
- Progress bar showing files processed
- Processing speed metrics
- Success/failure rates
- Estimated completion time

## Scaling

For large-scale processing:

1. **Increase Workers**: Use `--workers 50` or higher
2. **Larger Batches**: Use `--batch-size 500` or higher
3. **Monitor Quotas**: Watch Gemini API and BigQuery usage
4. **Parallel Processing**: Generate separate manifests for different prefixes and run in parallel

```bash
# High-performance processing
python extract_contracts.py --manifest large_dataset.yaml --workers 100 --batch-size 1000
```

## Cost Considerations

- **Gemini API**: Charged per character processed
- **BigQuery**: Charged for storage and queries
- **GCS**: Charged for storage and data transfer

Monitor usage in Google Cloud Console to optimize costs.
