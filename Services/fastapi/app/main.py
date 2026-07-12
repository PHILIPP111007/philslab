from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from .models import (
    SearchRequest,
    SearchResponse,
    Article,
    SummarizeRequest,
    SummarizeResponse,
)
from .services.pubmed_service import PubMedService
from .services.summarizer_service import SummarizerService
from .config import Config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pubmed_service = None
summarizer_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pubmed_service, summarizer_service
    pubmed_service = PubMedService()
    summarizer_service = SummarizerService()
    logger.info("Services initialized")
    yield
    if pubmed_service:
        await pubmed_service.close()


app = FastAPI(lifespan=lifespan)

config = Config()
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/search")
async def search_articles(request: SearchRequest):
    try:
        logger.info(f"Searching for: {request.query}")

        # Поиск статей с оптимизацией запроса через LLM
        articles = await pubmed_service.search_pubmed(request.query, max_results=10)

        response_articles = []
        for art in articles:
            response_articles.append(
                Article(
                    pmid=art.get("pmid", ""),
                    title=art.get("title", "Без названия"),
                    url=art.get("url", ""),
                    authors=art.get("authors", ""),
                    journal=art.get("journal", ""),
                    abstract=art.get("abstract", ""),
                    pub_date=art.get("pub_date", ""),
                )
            )

        return SearchResponse(
            summary=f"Найдено {len(articles)} статей по запросу: {request.query}",
            articles=response_articles,
            formatted_query=request.query.replace(" ", "+"),
            total_results=len(articles),
        )

    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/summarize")
async def summarize_articles(request: SummarizeRequest):
    try:
        logger.info(f"Summarizing {len(request.articles)} articles")

        # Получаем полные абстракты для всех статей
        articles_with_content = []
        for article in request.articles:
            logger.info(f"Fetching content for PMID: {article.pmid}")
            content = await pubmed_service.fetch_article_content(article.pmid)
            articles_with_content.append(
                {"pmid": article.pmid, "title": article.title, "content": content}
            )

        # Генерируем суммаризацию через LLM
        summary = await summarizer_service.summarize_articles(
            articles_with_content, request.user_query
        )

        return SummarizeResponse(
            summary=summary, summarized_articles=articles_with_content
        )

    except Exception as e:
        logger.error(f"Summarize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
