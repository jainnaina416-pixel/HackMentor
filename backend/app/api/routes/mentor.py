from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.core.logging import logger
from app.models.requests import MentorChatRequest
from app.models.responses import MentorChatResponse
from app.services.mentor_service import mentor_service

router = APIRouter(tags=["Ask Mentor"])

@router.post("/api/mentor/chat")
async def mentor_chat(req: MentorChatRequest):
    """
    Feature B: Ask Mentor.
    Answers follow-up questions using project context, uploaded documents,
    and retrieved historical hackathon projects. Supports live token SSE streaming.
    """
    try:
        if req.stream:
            return StreamingResponse(
                mentor_service.stream_chat(req),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                }
            )
        response = await mentor_service.chat(req)
        return response
    except Exception as e:
        logger.error(f"Error in mentor chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Mentor chat failed: {str(e)}")
