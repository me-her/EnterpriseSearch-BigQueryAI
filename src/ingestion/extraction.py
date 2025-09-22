#!/usr/bin/env python3
"""
Simple Contract Extraction Script

Workflow:
1. Get files from GCS folder
2. Check BigQuery for already processed files (optional)
3. Process new/unprocessed files with Gemini
4. Ingest to BigQuery

Usage:
    python simple_extract_contracts.py --workers 10 --batch-size 50
    python simple_extract_contracts.py --reprocess-all  # Process all files, including already processed ones

Features:
    - Automatically skips files already processed and stored in BigQuery
    - Use --reprocess-all flag to force reprocessing of all files

Environment Variables:
    GOOGLE_CLOUD_PROJECT: Google Cloud Project ID (required)
    GCS_BUCKET_NAME: GCS bucket name (required)
    GOOGLE_CLOUD_LOCATION: GCP region (default: us-central1)
    GCS_PREFIX: GCS prefix path 
    BQ_DATASET: BigQuery dataset (default: contracts_dataset)
    BQ_TABLE: BigQuery table (default: contracts)
"""

import argparse
import json
import logging
import os
import sys
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Optional

from google import genai
from google.genai.types import Part, GenerateContentConfig
from google.cloud import bigquery, storage
from tqdm import tqdm
from dotenv import load_dotenv
from contract_schema import ContractExtraction, Contract, extraction_prompt_template, json_parser

load_dotenv()
# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SimpleContractProcessor:
    def __init__(self, workers: int = 10, batch_size: int = 50):
        self.workers = workers
        self.batch_size = batch_size
        
        # Get environment variables
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.bucket_name = os.getenv("GCS_BUCKET_NAME")
        self.gcs_prefix = os.getenv("GCS_PREFIX", "2020/")
        self.dataset = os.getenv("BQ_DATASET", "contracts_dataset")
        self.table = os.getenv("BQ_TABLE", "contracts")
        
        # Validate required vars
        if not self.project_id or not self.bucket_name:
            print("Missing GOOGLE_CLOUD_PROJECT or GCS_BUCKET_NAME")
            sys.exit(1)
        
        # Initialize clients
        self.storage_client = storage.Client()
        self.bigquery_client = bigquery.Client(project=self.project_id)
        self.genai_client = genai.Client(vertexai=True, project=self.project_id, location=self.location)
        
        logger.info(f"Initialized with {workers} workers, batch size {batch_size}")
    
    def get_processed_files(self) -> List[str]:
        """Get list of already processed files from BigQuery"""
        try:
            query = f"""
                SELECT DISTINCT file_path 
                FROM `{self.project_id}.{self.dataset}.{self.table}`
            """
            
            query_job = self.bigquery_client.query(query)
            results = query_job.result()
            
            processed_files = [row.file_path for row in results]
            logger.info(f"Found {len(processed_files)} already processed files in BigQuery")
            return processed_files
            
        except Exception as e:
            logger.warning(f"Could not query processed files (table might not exist): {e}")
            return []
    
    def get_gcs_files(self, skip_processed: bool = True) -> List[str]:
        """Get all contract files from GCS, optionally filtering out already processed ones"""
        logger.info(f"Getting files from gs://{self.bucket_name}/{self.gcs_prefix}")
        
        bucket = self.storage_client.bucket(self.bucket_name)
        blobs = bucket.list_blobs(prefix=self.gcs_prefix)
        
        all_files = []
        for blob in blobs:
            if blob.name.lower().endswith(('.htm', '.html', '.pdf', '.txt')):
                all_files.append(f"gs://{self.bucket_name}/{blob.name}")
        
        logger.info(f"Found {len(all_files)} total files in GCS")
        
        if skip_processed:
            processed_files = set(self.get_processed_files())
            files = [f for f in all_files if f not in processed_files]
            logger.info(f"After filtering out processed files: {len(files)} files to process")
            logger.info(f"Skipped {len(all_files) - len(files)} already processed files")
        else:
            files = all_files
        
        return files
    
    def extract_contract(self, gcs_path: str) -> Optional[Dict[str, Any]]:
        """Extract contract data from a single file"""
        try:
            # Determine MIME type
            mime_type = "text/html"
            if gcs_path.lower().endswith('.pdf'):
                mime_type = "application/pdf"
            elif gcs_path.lower().endswith('.txt'):
                mime_type = "text/plain"
            
            # Create prompt
            format_instructions = json_parser.get_format_instructions()
            prompt = extraction_prompt_template.format(
                doc_type="contract", 
                format_instructions=format_instructions
            )
            
            # Generate content
            response = self.genai_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[prompt, Part.from_uri(file_uri=gcs_path, mime_type=mime_type)],
                config=GenerateContentConfig(
                    system_instruction="You are a contract analysis expert who extracts key entities from contract documents."
                )
            )
            
            # Parse response
            text = response.text.strip()
            if text.startswith("```") and text.endswith("```"):
                text = "\n".join(text.split("\n")[1:-1])
            
            # Validate with Pydantic
            data = json.loads(text)
            extraction = ContractExtraction(**data)
            
            # Add metadata
            contract_data = extraction.model_dump()
            contract_data['contract_id'] = str(uuid.uuid4())
            contract_data['file_path'] = gcs_path
            
            # Final validation
            final_contract = Contract(**contract_data)
            return final_contract.model_dump()
            
        except Exception as e:
            logger.error(f"Failed to extract {gcs_path}: {e}")
            return None
    
    def create_table(self):
        """Create BigQuery table if it doesn't exist"""
        try:
            table_ref = self.bigquery_client.dataset(self.dataset).table(self.table)
            self.bigquery_client.get_table(table_ref)
            logger.info("Table already exists")
        except:
            schema = [
                bigquery.SchemaField("contract_id", "STRING", mode="REQUIRED"),
                bigquery.SchemaField("file_path", "STRING", mode="REQUIRED"),
                bigquery.SchemaField("company_name", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("form_type", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("filing_date", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("state_of_incorp", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("contract_category", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("contract_type", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("governing_law_state", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("contract_summary", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("numeric_value", "FLOAT", mode="NULLABLE"),
                bigquery.SchemaField("parties", "STRING", mode="REPEATED"),
                bigquery.SchemaField("clauses", "STRING", mode="REPEATED"),
            ]
            
            table = bigquery.Table(table_ref, schema=schema)
            self.bigquery_client.create_table(table)
            logger.info("Created table")
    
    def insert_batch(self, rows: List[Dict[str, Any]]):
        """Insert batch to BigQuery"""
        if not rows:
            return
        
        try:
            table_ref = self.bigquery_client.dataset(self.dataset).table(self.table)
            
            # Format for BigQuery
            bq_rows = []
            for row in rows:
                bq_row = {}
                for key, value in row.items():
                    if key in ['parties', 'clauses'] and isinstance(value, list):
                        bq_row[key] = [str(item) for item in value if item]
                    elif value is not None:
                        bq_row[key] = str(value)
                bq_rows.append(bq_row)
            
            errors = self.bigquery_client.insert_rows_json(table_ref, bq_rows)
            if errors:
                logger.error(f"BigQuery errors: {errors}")
            else:
                logger.info(f"Inserted {len(rows)} rows")
                
        except Exception as e:
            logger.error(f"Insert failed: {e}")
    
    def process_all(self, skip_processed: bool = True):
        """Main processing function"""
        # Get files
        files = self.get_gcs_files(skip_processed=skip_processed)
        if not files:
            logger.info("No files found to process")
            return
        
        # Create table
        self.create_table()
        
        # Process files
        successful = 0
        batch = []
        
        with ThreadPoolExecutor(max_workers=self.workers) as executor:
            future_to_file = {executor.submit(self.extract_contract, f): f for f in files}
            
            with tqdm(total=len(files), desc="Processing") as pbar:
                for future in as_completed(future_to_file):
                    result = future.result()
                    if result:
                        batch.append(result)
                        successful += 1
                        
                        # Insert when batch is full
                        if len(batch) >= self.batch_size:
                            self.insert_batch(batch)
                            batch = []
                    
                    pbar.update(1)
        
        # Insert remaining
        if batch:
            self.insert_batch(batch)
        
        logger.info(f"Complete: {successful}/{len(files)} successful ({successful/len(files)*100:.1f}%)")


def main():
    parser = argparse.ArgumentParser(description="Simple Contract Extraction")
    parser.add_argument("--workers", type=int, default=5, help="Number of workers")
    parser.add_argument("--batch-size", type=int, default=100, help="BigQuery batch size")
    parser.add_argument("--reprocess-all", action="store_true", 
                       help="Reprocess all files, including those already in BigQuery")
    
    args = parser.parse_args()
    
    processor = SimpleContractProcessor(workers=args.workers, batch_size=args.batch_size)
    processor.process_all(skip_processed=not args.reprocess_all)


if __name__ == "__main__":
    main()