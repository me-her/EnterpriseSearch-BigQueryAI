import asyncio

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools.bigquery import BigQueryCredentialsConfig
from google.adk.tools.bigquery import BigQueryToolset
from google.adk.tools.bigquery.config import BigQueryToolConfig
from google.adk.tools.bigquery.config import WriteMode
from google.genai import types
import google.auth
from .prompts.root_agent_prompt import INSTRUCTION

APP_NAME = "sec-filings"
GEMINI_MODEL = "gemini-2.5-pro"

tool_config = BigQueryToolConfig(write_mode=WriteMode.BLOCKED)

# Define a credentials config - in this example we are using application default
# credentials
# https://cloud.google.com/docs/authentication/provide-credentials-adc
application_default_credentials, _ = google.auth.default()
credentials_config = BigQueryCredentialsConfig(
    credentials=application_default_credentials
)

# Instantiate a BigQuery toolset
bigquery_toolset = BigQueryToolset(
    credentials_config=credentials_config, bigquery_tool_config=tool_config
)

# Agent Definition
root_agent = Agent(
    model=GEMINI_MODEL,
    name='bigquery_agent',
    description=(
        "Agent to answer questions about BigQuery data and models and execute"
        " SQL queries."
    ),
    instruction=INSTRUCTION,
    tools=[bigquery_toolset],
)

# Session and Runner
session_service = InMemorySessionService()
runner = Runner(
    agent=root_agent, app_name=APP_NAME, session_service=session_service
)

