"""
Exa search service for OffferHop.

Uses Exa neural search to discover restaurant deal pages with full content.
Claude then parses the raw page content into structured offer data.
"""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_exa_client():
    from exa_py import Exa
    return Exa(api_key=settings.EXA_API_KEY)


def search_deals(queries: list, num_results_per_query: int = 8) -> list:
    """
    Execute Exa neural search queries and return page content for Claude parsing.
    Deduplicates by URL across all queries.
    """
    if not settings.EXA_API_KEY:
        logger.warning("EXA_API_KEY not set — returning empty results")
        return []

    from exa_py.api import ContentsOptions

    exa = _get_exa_client()
    seen_urls: set = set()
    all_results = []

    for query in queries:
        try:
            response = exa.search(
                query,
                num_results=num_results_per_query,
                contents=ContentsOptions(
                    text=True,
                    highlights=True,
                ),
            )
            for result in response.results:
                url = getattr(result, 'url', '')
                if not url or url in seen_urls:
                    continue
                seen_urls.add(url)
                highlights = getattr(result, 'highlights', None) or []
                all_results.append({
                    'url':        url,
                    'title':      getattr(result, 'title', '') or '',
                    'text':       getattr(result, 'text', '') or '',
                    'highlights': highlights if isinstance(highlights, list) else [],
                    'score':      getattr(result, 'score', 0),
                })
        except Exception as e:
            logger.error(f"Exa search failed for query '{query}': {e}")

    logger.info(f"Exa returned {len(all_results)} unique pages across {len(queries)} queries")
    return all_results
