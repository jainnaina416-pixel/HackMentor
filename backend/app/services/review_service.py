from langchain_core.messages import SystemMessage, HumanMessage

from app.core.llm import get_llm, parse_json_from_llm
from app.core.logging import logger
from app.models.requests import ProjectReviewRequest
from app.models.responses import ProjectReviewResponse
from app.rag.prompts import PROJECT_REVIEW_SYSTEM_PROMPT
from app.rag.retriever import retriever
from app.services.project_service import project_service

class ReviewService:
    async def review_project(self, req: ProjectReviewRequest) -> ProjectReviewResponse:
        logger.info(f"Running Project Review for project: {req.project_id}")

        project = project_service.get_project(req.project_id) if req.project_id else None
        prob = project.get("problem_statement", "") if project else ""
        sol = req.solution_description or (project.get("solution", "") if project else "")

        # 1. RAG Retrieval for benchmarks
        query = f"{sol} {req.architecture} {' '.join(req.tech_stack)}".strip()
        historical_docs = retriever.retrieve_historical_projects(query, top_k=3)
        team_docs = retriever.retrieve_team_documents(query, project_id=req.project_id, top_k=2)

        rag_context = retriever.format_context_for_prompt(historical_docs, team_docs)

        # 2. Build Prompt
        human_prompt = f"""
### Project Review Submission:
- Problem: {prob or 'Not provided'}
- Solution Description: {sol or 'Not provided'}
- Architecture & Technical Details: {req.architecture or 'FastAPI backend, React frontend'}
- Technologies: {', '.join(req.tech_stack) if req.tech_stack else 'React, Python, FastAPI'}

### Historical Hackathon Benchmarks:
{rag_context}

Please evaluate this project objectively and output raw JSON matching the review schema.
"""

        llm = get_llm()
        response = await llm.ainvoke([
            SystemMessage(content=PROJECT_REVIEW_SYSTEM_PROMPT),
            HumanMessage(content=human_prompt)
        ])

        parsed = parse_json_from_llm(response.content)

        similar_projects = retriever.to_similar_project_items(historical_docs)
        source_citations = retriever.to_source_citations(historical_docs + team_docs)

        def _to_text(val, fallback=""):
            if isinstance(val, list):
                return "\n".join(f"- {item}" for item in val)
            return val or fallback

        return ProjectReviewResponse(
            problem_solution_fit=parsed.get("problem_solution_fit", "Good alignment with core user problem."),
            technical_feasibility=parsed.get("technical_feasibility", "Feasible within typical hackathon timeframe."),
            innovation_and_differentiation=parsed.get("innovation_and_differentiation", "Clear differentiator in approach."),
            completeness=parsed.get("completeness", "Core MVP flow planned."),
            user_experience=parsed.get("user_experience", "Intuitive interaction model."),
            risks=_to_text(parsed.get("risks"), "Ensure demo works without depending on live network latency."),
            missing_pieces=_to_text(parsed.get("missing_pieces"), "Backup demo video and slide outline."),
            recommended_improvements=parsed.get("recommended_improvements", [
                "Freeze scope early",
                "Add visual feedback during async operations",
                "Rehearse the judging presentation"
            ]),
            relevant_historical_comparisons=similar_projects,
            evidence_and_sources=source_citations,
            technical_implementation=parsed.get("technical_implementation", "Clean modular structure.")
        )

review_service = ReviewService()
