import os, subprocess, shlex, asyncio, logging
from typing import List, Tuple, Optional, Dict, Any
import httpx

logger = logging.getLogger(__name__)


class ResourceService:
    """Service class that orchestrates external API calls and normalises results.
    All public methods are async and can be called from FastAPI routes.
    """

    @staticmethod
    def get_categories() -> List[str]:
        return [
            "Datasets",
            "APIs",
            "Documentation",
            "Libraries",
            "Tutorials",
            "Research Papers",
            "Similar Projects",
            "Tools",
        ]

    @staticmethod
    async def get_all_resources() -> List[Dict[str, Any]]:
        """Return a static empty list of resources (placeholder)."""
        return []

    @staticmethod
    async def search(
        q: str,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Run selected provider searches concurrently and return paginated results.
        Returns ``(results, error)`` where *error* is ``None`` on success.
        """
        normalized_category = (
            None if not category or str(category).strip().lower() == "all" else str(category).strip()
        )
        try:
            tasks: List[Any] = []
            provider_names: List[str] = []
            # Datasets
            if not normalized_category or normalized_category == "Datasets":
                tasks.append(ResourceService._search_hf_datasets(q))
                provider_names.append("HF Datasets")
                if os.getenv("KAGGLE_USERNAME") and os.getenv("KAGGLE_KEY"):
                    tasks.append(ResourceService._search_kaggle(q))
                    provider_names.append("Kaggle")
            # Public APIs
            if not normalized_category or normalized_category == "APIs":
                tasks.append(ResourceService._search_public_apis(q))
                provider_names.append("Public APIs")
            # Documentation (static mapping)
            if not normalized_category or normalized_category == "Documentation":
                tasks.append(ResourceService._search_mdns(q))
                provider_names.append("Documentation")
            # Libraries
            if not normalized_category or normalized_category == "Libraries":
                tasks.append(ResourceService._search_github_repos(q, output_category="Libraries"))
                provider_names.append("GitHub Libraries")
            # Tutorials
            if not normalized_category or normalized_category == "Tutorials":
                tasks.append(ResourceService._search_github_repos(q, topic="tutorial", output_category="Tutorials"))
                provider_names.append("GitHub Tutorials")
            # Research Papers
            if not normalized_category or normalized_category == "Research Papers":
                tasks.append(ResourceService._search_arxiv(q))
                provider_names.append("arXiv")
            # Similar Projects
            if not normalized_category or normalized_category == "Similar Projects":
                tasks.append(ResourceService._search_github_repos(q, output_category="Similar Projects"))
                provider_names.append("GitHub Similar Projects")
            # Tools (broader GitHub search)
            if not normalized_category or normalized_category == "Tools":
                tasks.append(ResourceService._search_github_repos(q, output_category="Tools"))
                provider_names.append("GitHub Tools")

            raw_results = await asyncio.gather(*tasks, return_exceptions=True)
            merged: List[Dict[str, Any]] = []
            for name, result in zip(provider_names, raw_results):
                if isinstance(result, Exception):
                    logger.error(f"{name} provider error: {result}")
                    continue
                logger.info(f"{name} returned {len(result)} items")
                merged.extend(result)

            # Deduplicate by URL
            seen = set()
            unique: List[Dict[str, Any]] = []
            for item in merged:
                url = item.get("url")
                if url and url not in seen:
                    seen.add(url)
                    unique.append(item)

            start = (page - 1) * page_size
            end = start + page_size
            return unique[start:end], None
        except Exception as exc:
            logger.exception("Unexpected error in ResourceService.search")
            return [], str(exc)

    # ------------------------------------------------------------------
    # Individual source helpers (all async, short timeout, robust error handling)
    # ------------------------------------------------------------------
    @staticmethod
    async def _search_hf_datasets(q: str) -> List[Dict[str, Any]]:
        url = f"https://huggingface.co/api/datasets?search={q}&limit=10"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
                return [
                    {
                        "id": f"hf-{d['id']}",
                        "name": d.get("id"),
                        "description": d.get("description", ""),
                        "category": "Datasets",
                        "source": "Hugging Face",
                        "url": f"https://huggingface.co/datasets/{d['id']}",
                        "whyUseful": "",
                        "tags": d.get("tags", []),
                    }
                    for d in data
                ]
        except Exception:
            return []

    @staticmethod
    async def _search_kaggle(q: str) -> List[Dict[str, Any]]:
        try:
            cmd = f"kaggle datasets list -s {shlex.quote(q)} -j 10"
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            if proc.returncode != 0:
                return []
            data = json.loads(proc.stdout)
            return [
                {
                    "id": f"kaggle-{d['ref']}",
                    "name": d.get("title"),
                    "description": d.get("subtitle", ""),
                    "category": "Datasets",
                    "source": "Kaggle",
                    "url": f"https://www.kaggle.com/datasets/{d['ref']}",
                    "whyUseful": "",
                    "tags": d.get("tags", []),
                }
                for d in data
            ]
        except Exception:
            return []

    @staticmethod
    async def _search_public_apis(q: str) -> List[Dict[str, Any]]:
        url = f"https://api.publicapis.org/entries?title={q}&https=true"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                entries = resp.json().get("entries", [])
                return [
                    {
                        "id": f"api-{e['API']}",
                        "name": e["API"],
                        "description": e.get("Description", ""),
                        "category": "APIs",
                        "source": "Public APIs",
                        "url": e.get("Link"),
                        "whyUseful": "",
                        "tags": [e.get("Auth") or "", e.get("Category") or ""],
                    }
                    for e in entries[:10]
                ]
        except Exception:
            return []

    @staticmethod
    async def _search_mdns(q: str) -> List[Dict[str, Any]]:
        docs = {
            "react": "https://react.dev/",
            "fastapi": "https://fastapi.tiangolo.com/",
            "python": "https://docs.python.org/3/",
            "openai": "https://platform.openai.com/docs",
            "tensor": "https://www.tensorflow.org/",
            "tensorflow": "https://www.tensorflow.org/",
            "machine learning": "https://scikit-learn.org/",
            "ml": "https://scikit-learn.org/",
            "food": "https://www.openfoodfacts.org/",
        }
        results = []
        for key, url in docs.items():
            if q.lower() in key:
                results.append(
                    {
                        "id": f"doc-{key}",
                        "name": f"{key.title()} Documentation",
                        "description": f"Official documentation for {key.title()}.",
                        "category": "Documentation",
                        "source": "Official Docs",
                        "url": url,
                        "whyUseful": "",
                        "tags": [],
                    }
                )
        return results

    @staticmethod
    async def _search_github_repos(
        q: str,
        language: Optional[str] = None,
        topic: Optional[str] = None,
        output_category: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        token = os.getenv("GITHUB_TOKEN")
        headers = {"Authorization": f"token {token}"} if token else {}
        query = q
        if language:
            query += f" language:{language}"
        if topic:
            query += f" topic:{topic}"
        url = f"https://api.github.com/search/repositories?{httpx.QueryParams({'q': query, 'per_page': 20, 'sort': 'stars'})}"
        try:
            async with httpx.AsyncClient(headers=headers, timeout=10) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                items = resp.json().get("items", [])
                cat = output_category
                if not cat:
                    if topic == "tutorial":
                        cat = "Tutorials"
                    elif topic == "tool":
                        cat = "Tools"
                    elif topic is None:
                        cat = "Similar Projects"
                    else:
                        cat = "Libraries"
                return [
                    {
                        "id": f"gh-{itm['full_name']}",
                        "name": itm["full_name"],
                        "description": itm.get("description", ""),
                        "category": cat,
                        "source": "GitHub",
                        "url": itm["html_url"],
                        "whyUseful": "",
                        "tags": itm.get("topics", []),
                    }
                    for itm in items
                ]
        except Exception:
            return []

    @staticmethod
    async def _search_arxiv(q: str) -> List[Dict[str, Any]]:
        url = f"http://export.arxiv.org/api/query?search_query=all:{q}&max_results=10"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                import xml.etree.ElementTree as ET
                root = ET.fromstring(resp.text)
                ns = {"atom": "http://www.w3.org/2005/Atom"}
                results = []
                for entry in root.findall('atom:entry', ns):
                    title = entry.find('atom:title', ns).text.strip()
                    link = entry.find('atom:id', ns).text.strip()
                    summary = entry.find('atom:summary', ns).text.strip()
                    results.append(
                        {
                            "id": f"arxiv-{hash(link)}",
                            "name": title,
                            "description": summary,
                            "category": "Research Papers",
                            "source": "arXiv",
                            "url": link,
                            "whyUseful": "",
                            "tags": [],
                        }
                    )
                return results
        except Exception:
            return []

# expose a singleton for import compatibility
resource_service = ResourceService()
