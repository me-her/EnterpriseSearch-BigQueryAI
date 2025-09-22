from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional


class ContractExtraction(BaseModel):

    company_name: Optional[str] = Field(description="Company name - most queried field")
    form_type: Optional[str] = Field(description="SEC form type like 10-K ,10-Q ,20-F ,40-F ,6-K ,8-K ,DEF 14A ,S-4. If not found, empty string")
    filing_date: Optional[str] = Field(description="Filing date in YYYY-MM-DD format")
    state_of_incorp: Optional[str] = Field(description="Company's state of incorporation")
    contract_category: Optional[str] = Field(description="Contract category: 'Security','Employment', 'Lease','Purchase/M&A', 'Service/Supply', 'Shareholder/Governance', 'Other'.")
    contract_type: Optional[str] = Field(description="Contract type: 'Restatement', 'Amendment', 'Joinder', 'Termination', etc.")
    governing_law_state: Optional[str] = Field(description="Governing law state like 'DE', 'CA'")
    contract_summary: Optional[str] = Field(description="Overall summary of contract's purpose, and key details.")
    numeric_value: Optional[float] = Field(description="Value of the contract/agreement")
    parties: List[str] = Field(description="List of party names involved", default=[])
    clauses: List[str] = Field(description="List of clause types like 'Change of Control', 'Auto-Renewal'", default=[])


class Contract(ContractExtraction):
    contract_id: str = Field(description="Unique identifier for the contract")
    file_path: str = Field(description="GCS file path of the contract document")

json_parser = JsonOutputParser(pydantic_object=ContractExtraction)
format_instructions = json_parser.get_format_instructions()

extraction_prompt_template = PromptTemplate(
    input_variables=["doc_type", "format_instructions"],
    template="""You are an expert SEC filing and contract analyst. Extract information from this document.

Document Type: {doc_type}

{format_instructions}

CRITICAL INSTRUCTIONS:
- Extract ALL available information, even if some fields are null
- For dates, use YYYY-MM-DD format only
- For numeric_value, extract any dollar amounts mentioned
- For parties, include all company/individual names involved
- For clauses, identify key clause types like termination, renewal, change of control, etc.
- If this is an SEC filing containing multiple contracts, focus on the most significant one
- Use null for fields not found or not applicable

Return ONLY valid JSON, no markdown, no explanations."""
)

