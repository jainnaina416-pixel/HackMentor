from langchain_core.messages import SystemMessage, HumanMessage

from app.core.llm import get_llm, parse_json_from_llm
from app.core.logging import logger
from app.models.requests import PitchGenerationRequest
from app.models.responses import PitchGenerationResponse, JudgeQuestionItem
from app.rag.prompts import PITCH_GENERATION_SYSTEM_PROMPT
from app.rag.retriever import retriever
from app.services.project_service import project_service

class PitchService:
    async def generate_pitch(self, req: PitchGenerationRequest) -> PitchGenerationResponse:
        logger.info(f"Generating pitch for project: {req.project_id}")

        project = project_service.get_project(req.project_id) if req.project_id else None
        prob = project.get("problem_statement", "") if project else ""
        sol = req.solution_description or (project.get("solution", "") if project else "")

        # Retrieve similar winning pitches / projects for tone and judging patterns
        query = f"{prob} {sol}".strip()
        historical_docs = retriever.retrieve_historical_projects(query, top_k=2)
        team_docs = retriever.retrieve_team_documents(query, project_id=req.project_id, top_k=2)
        rag_context = retriever.format_context_for_prompt(historical_docs, team_docs)

        human_prompt = f"""
### Team Project Inputs:
- Problem: {prob or 'Not explicitly specified'}
- Solution: {sol or 'Not explicitly specified'}
- Target Audience: {req.target_audience}
- Pitch Duration: {req.pitch_duration}

### Context & Historical Benchmarks:
{rag_context}

Generate a winning pitch pack in valid raw JSON matching the required schema.
"""

        llm = get_llm()
        response = await llm.ainvoke([
            SystemMessage(content=PITCH_GENERATION_SYSTEM_PROMPT),
            HumanMessage(content=human_prompt)
        ])

        parsed = parse_json_from_llm(response.content)

        # Parse judge questions safely into JudgeQuestionItem objects
        raw_questions = parsed.get("likely_judge_questions", [])
        judge_questions = []
        for i, q in enumerate(raw_questions, 1):
            if isinstance(q, dict):
                judge_questions.append(JudgeQuestionItem(
                    id=str(q.get("id", f"q{i}")),
                    question=q.get("question", "What is your core competitive advantage?"),
                    suggestedAnswer=q.get("suggested_answer") or q.get("suggestedAnswer") or "We focused on a constrained, highly reliable MVP demo."
                ))

        return PitchGenerationResponse(
            project_title_and_tagline=parsed.get("project_title_and_tagline", "HackMentor: AI Copilot for Hackathon Teams"),
            problem=parsed.get("problem", prob or "Hackathon teams lose critical time to poor scoping and unavailable mentors."),
            proposed_solution=parsed.get("proposed_solution", sol or "An AI-backed mentor providing real-time scoping, RAG guidance, and pitch prep."),
            target_users_and_impact=parsed.get("target_users_and_impact", "Hackathon participants and organizers."),
            key_features=parsed.get("key_features", ["Live RAG Mentorship", "PDF Context Ingestion", "Pitch Outline Generator"]),
            technical_architecture_explanation=parsed.get("technical_architecture_explanation", "FastAPI backend communicating over REST and SSE to LangChain and persistent ChromaDB."),
            differentiation=parsed.get("differentiation", "Grounded specifically in historical hackathon winning benchmarks rather than generic LLM advice."),
            demo_sequence=parsed.get("demo_sequence", [
                "1. Introduce user pain point",
                "2. Upload problem statement PDF",
                "3. Ask mentor for architecture validation",
                "4. Review generated pitch outline"
            ]),
            suggested_slide_outline=parsed.get("suggested_slide_outline", [
                "Slide 1: Problem & Impact",
                "Slide 2: Solution Demo",
                "Slide 3: Architecture & Tech Stack",
                "Slide 4: Feasibility & Business Value",
                "Slide 5: Team & Next Steps"
            ]),
            likely_judge_questions=judge_questions,
            missing_information_to_fill=parsed.get("missing_information_to_fill", [
                "Verify live demo connectivity and screen resolution",
                "Ensure team member speaking roles are clearly divided"
            ])
        )

pitch_service = PitchService()
