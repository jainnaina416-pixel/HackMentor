import json
from fastapi import APIRouter, Query
from typing import List, Optional, Tuple
from app.services.resource_service import ResourceService

router = APIRouter(prefix="/api/resources", tags=["Resources"])

@router.get("/categories")
async def get_categories() -> List[str]:
    """Return the list of supported resource categories."""
    return ResourceService.get_categories()

@router.get("/search")
async def search_resources(
    q: str = Query(..., description="Search keywords"),
    category: Optional[str] = Query(None, description="Category filter"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict:
    """Search external sources and return normalized resource items.
    The response format matches the frontend ``ResourceItem`` type.
    """
    results, error = await ResourceService.search(q, category, page, page_size)
    return {"results": results, "error": error or None}
