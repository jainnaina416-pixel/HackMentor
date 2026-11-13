from typing import Optional
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.llm import get_llm, parse_json_from_llm
from app.core.logging import logger
from app.models.requests import ProblemAnalysisRequest
from app.models.responses import ProblemAnalysisResponse
from app.rag.prompts import PROBLEM_ANALYSIS_SYSTEM_PROMPT
from app.rag.retriever import retriever
from app.services.project_service import project_service

class AnalysisService:
    async def analyze_problem_and_solution(self, req: ProblemAnalysisRequest) -> ProblemAnalysisResponse:
        logger.info(f"Running Problem/Idea Analysis for project: {req.project_id}")

        # 1. RAG Retrieval
        search_query = f"{req.problem_statement} {req.proposed_solution}".strip()
        historical_docs = retriever.retrieve_historical_projects(search_query, top_k=4)
        team_docs = retriever.retrieve_team_documents(search_query, project_id=req.project_id, top_k=2)

        # 2. Build Safe Context Block
        rag_context = retriever.format_context_for_prompt(historical_docs, team_docs)

        # 3. Construct LLM Prompt
        human_prompt = f"""
### Team Project Inputs:
- Problem Statement:
{req.problem_statement}

- Proposed Solution Idea:
{req.proposed_solution or "No specific solution proposed yet; evaluate the raw problem."}

### Retrieved Knowledge Base Context:
{rag_context}

Please provide your strategic analysis in valid raw JSON matching the required schema.
"""

        llm = get_llm()
        response = await llm.ainvoke([
            SystemMessage(content=PROBLEM_ANALYSIS_SYSTEM_PROMPT),
            HumanMessage(content=human_prompt)
        ])

        # 4. Parse Structured Output
        parsed = parse_json_from_llm(response.content)

        # 5. Attach RAG Provenance & Similar Projects
        similar_projects = retriever.to_similar_project_items(historical_docs)
        source_citations = retriever.to_source_citations(historical_docs + team_docs)

        result = ProblemAnalysisResponse(
            problem_summary=parsed.get("problem_summary", req.problem_statement[:150]),
            target_users=parsed.get("target_users", ["General Hackathon Users"]),
            core_requirements=parsed.get("core_requirements", ["Build core functional prototype"]),
            constraints_and_assumptions=parsed.get("constraints_and_assumptions", ["Hackathon time limit"]),
            proposed_solution_assessment=parsed.get("proposed_solution_assessment", "Solution directly addresses problem scope."),
            similar_historical_projects=similar_projects,
            missing_requirements=parsed.get("missing_requirements", []),
            risks=parsed.get("risks", ["Scope creep"]),
            recommended_next_steps=parsed.get("recommended_next_steps", ["Freeze MVP architecture"]),
            sources_used=source_citations
        )

        return result

analysis_service = AnalysisService()
