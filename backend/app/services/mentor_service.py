import uuid
import json
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.core.llm import get_llm
from app.core.logging import logger
from app.core.database import save_message, get_conversation_messages
from app.models.requests import MentorChatRequest
from app.models.responses import MentorChatResponse, SourceCitation
from app.rag.prompts import MENTOR_SYSTEM_PROMPT
from app.rag.retriever import retriever
from app.services.project_service import project_service

class MentorService:
    def _build_context_and_messages(self, req: MentorChatRequest):
        # 1. Fetch Project Data
        project = project_service.get_project(req.project_id) if req.project_id else None
        prob = project.get("problem_statement") if project else ""
        sol = project.get("solution") if project else ""

        # Check client-supplied extra context
        if req.context:
            prob = req.context.get("problemStatement") or prob
            sol = req.context.get("projectIdea") or sol

        # 2. RAG Retrieval matching User's Message + Project Context
        query = f"{req.user_message} {prob}".strip()
        historical_docs = retriever.retrieve_historical_projects(query, top_k=3)
        team_docs = retriever.retrieve_team_documents(query, project_id=req.project_id, top_k=2)

        rag_context = retriever.format_context_for_prompt(historical_docs, team_docs)

        # 3. Construct System Message with Dynamic Context
        system_content = f"""{MENTOR_SYSTEM_PROMPT}

### Current Team Context:
- Problem: {prob or 'Not yet specified'}
- Solution: {sol or 'Not yet specified'}

### Knowledge Base & Uploaded Documents:
{rag_context}
"""
        messages = [SystemMessage(content=system_content)]

        # 4. Append Conversation History
        history = req.history or []
        if req.conversation_id and not history:
            stored_msgs = get_conversation_messages(req.conversation_id)
            for m in stored_msgs:
                history.append({"role": m["role"], "content": m["content"]})

        for h in history[-8:]:  # Keep recent history
            role = h.get("role")
            content = h.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

        # Current question
        messages.append(HumanMessage(content=req.user_message))

        citations = retriever.to_source_citations(historical_docs + team_docs)
        return messages, citations

    async def chat(self, req: MentorChatRequest) -> MentorChatResponse:
        """Non-streaming mentor answer."""
        conv_id = req.conversation_id or f"conv_{uuid.uuid4().hex[:10]}"
        messages, citations = self._build_context_and_messages(req)

        llm = get_llm(streaming=False)
        response = await llm.ainvoke(messages)
        content = response.content

        # Save conversation to database
        user_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        bot_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        save_message(user_msg_id, conv_id, "user", req.user_message)
        save_message(bot_msg_id, conv_id, "assistant", content, sources=[c.model_dump() for c in citations])

        return MentorChatResponse(
            message=content,
            conversation_id=conv_id,
            sources=citations
        )

    async def stream_chat(self, req: MentorChatRequest) -> AsyncGenerator[str, None]:
        """Streaming mentor answer yielding Server-Sent Events (SSE)."""
        conv_id = req.conversation_id or f"conv_{uuid.uuid4().hex[:10]}"
        messages, citations = self._build_context_and_messages(req)

        llm = get_llm(streaming=True)
        full_text = ""

        try:
            async for chunk in llm.astream(messages):
                token = chunk.content
                if token:
                    full_text += token
                    payload = json.dumps({"message": token, "conversation_id": conv_id})
                    yield f"data: {payload}\n\n"

            # Final citations payload
            if citations:
                cite_payload = json.dumps({
                    "sources": [c.model_dump() for c in citations],
                    "conversation_id": conv_id
                })
                yield f"data: {cite_payload}\n\n"

            yield "data: [DONE]\n\n"

            # Persist to database
            save_message(f"msg_{uuid.uuid4().hex[:8]}", conv_id, "user", req.user_message)
            save_message(
                f"msg_{uuid.uuid4().hex[:8]}",
                conv_id,
                "assistant",
                full_text,
                sources=[c.model_dump() for c in citations]
            )

        except Exception as e:
            logger.error(f"Error during mentor streaming: {e}", exc_info=True)
            err_data = json.dumps({"error": str(e)})
            yield f"data: {err_data}\n\n"

mentor_service = MentorService()
