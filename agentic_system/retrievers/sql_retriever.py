"""
agentic_system/retrievers/sql_retriever.py
MySQL retriever — uses LLM to generate SQL from natural language, then executes it.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

import json
from typing import List, Dict, Any, Optional

import mysql.connector
from langchain_ollama import ChatOllama
from langchain_classic.prompts import PromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage

from core.config import settings
from core.logging import get_logger
from agentic_system.config.settings import agent_settings

logger = get_logger(__name__)

SQL_GEN_PROMPT = """You are a MySQL expert. Given the database schema and a question, write a single valid MySQL SELECT query.

Database schema:
{schema}

Question: {question}

Rules:
- Return ONLY the SQL query, no explanation
- Use LIMIT {limit} unless the question asks for all records
- Use proper MySQL syntax
- If the question cannot be answered with SQL, return: SELECT 'NOT_APPLICABLE' as result

SQL Query:"""


class SQLRetriever:
    def __init__(self):
        self._llm = ChatOllama(
            base_url=settings.ollama_base_url,
            model=settings.ollama_model,
            temperature=0,
        )
        self._schema_cache: Optional[str] = None

    def _get_connection(self):
        return mysql.connector.connect(
            host=settings.mysql_host,
            port=settings.mysql_port,
            user=settings.mysql_user,
            password=settings.mysql_password,
            database=settings.mysql_database,
            connection_timeout=10,
        )

    def get_schema(self) -> str:
        """Fetch table schemas from MySQL information_schema."""
        if self._schema_cache:
            return self._schema_cache
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = %s
                ORDER BY TABLE_NAME, ORDINAL_POSITION
                """,
                (settings.mysql_database,),
            )
            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            schema_lines = []
            current_table = None
            for table, col, dtype, nullable, key in rows:
                if table != current_table:
                    if current_table:
                        schema_lines.append("")
                    schema_lines.append(f"Table: {table}")
                    current_table = table
                key_info = f" [{key}]" if key else ""
                null_info = " NULL" if nullable == "YES" else " NOT NULL"
                schema_lines.append(f"  - {col}: {dtype}{null_info}{key_info}")

            self._schema_cache = "\n".join(schema_lines)
            return self._schema_cache
        except Exception as e:
            logger.error(f"Schema fetch error: {e}")
            return "Schema unavailable"

    def generate_sql(self, question: str) -> str:
        """Use LLM to translate natural language to SQL."""
        schema = self.get_schema()
        prompt = SQL_GEN_PROMPT.format(
            schema=schema,
            question=question,
            limit=agent_settings.top_k_sql_rows,
        )
        try:
            response = self._llm.invoke([HumanMessage(content=prompt)])
            sql = response.content.strip()
            # Clean up markdown code blocks if present
            sql = sql.replace("```sql", "").replace("```", "").strip()
            return sql
        except Exception as e:
            logger.error(f"SQL generation error: {e}")
            return ""

    def execute_query(self, sql: str) -> Dict[str, Any]:
        """Execute a SELECT query and return rows + columns."""
        if not sql or "NOT_APPLICABLE" in sql:
            return {"columns": [], "rows": [], "error": "No applicable SQL"}
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql)
            rows = cursor.fetchall()
            columns = [d[0] for d in cursor.description] if cursor.description else []
            cursor.close()
            conn.close()
            return {"columns": columns, "rows": rows, "sql": sql, "error": None}
        except Exception as e:
            logger.error(f"SQL execute error: {e} | SQL: {sql}")
            return {"columns": [], "rows": [], "sql": sql, "error": str(e)}

    def query(self, question: str) -> Dict[str, Any]:
        """Full pipeline: NL -> SQL -> execute -> return results."""
        sql = self.generate_sql(question)
        if not sql:
            return {"columns": [], "rows": [], "error": "Could not generate SQL"}
        return self.execute_query(sql)

    def results_to_text(self, result: Dict[str, Any]) -> str:
        """Convert SQL result dict to readable text for the LLM."""
        if result.get("error"):
            return f"SQL Error: {result['error']}"
        rows = result.get("rows", [])
        if not rows:
            return "No results found in the database."
        lines = [f"SQL: {result.get('sql', '')}", f"Found {len(rows)} row(s):"]
        for row in rows[:20]:  # Cap display
            lines.append(str(row))
        if len(rows) > 20:
            lines.append(f"... and {len(rows) - 20} more rows")
        return "\n".join(lines)


# Singleton
sql_retriever = SQLRetriever()
