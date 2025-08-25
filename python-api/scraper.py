# scraper.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from newspaper import Article
import requests
from bs4 import BeautifulSoup
import re

# --- 1. CREATE THE ROUTER OBJECT ---
# This is the 'router' that your main.py file needs to import.
router = APIRouter()

# This defines the expected input for our API call.
class ScrapeRequest(BaseModel):
    url: str

# This is a helper function from your original script.
def clean_html_text(html):
    text = re.sub(r'\s+', ' ', html)
    text = text.replace('\xa0', ' ').strip()
    return text

# --- 2. THE SCRAPING LOGIC IS NOW INSIDE AN API ENDPOINT ---
@router.post("/scrape")
async def scrape_website(request: ScrapeRequest):
    """
    Scrapes the main text content from a given URL.
    """
    try:
        # First, try to use the newspaper library, as it's often more accurate
        article = Article(request.url)
        article.download()
        article.parse()
        content = article.text

        # If newspaper fails to get good content, fall back to BeautifulSoup
        if not content or len(content) < 100:
            response = requests.get(request.url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            })
            response.raise_for_status() # Raise an exception for bad status codes
            
            soup = BeautifulSoup(response.text, 'html.parser')
            main_content = soup.find('article') or soup.find('main')
            if main_content:
                content = main_content.get_text()
            else:
                # Fallback to joining all paragraph tags if no main content area is found
                paragraphs = soup.find_all('p')
                content = "\n".join(p.get_text() for p in paragraphs)

        final_text = clean_html_text(content)

        if not final_text or len(final_text) < 50:
            raise HTTPException(status_code=422, detail="Unable to extract meaningful content.")

        return {"content": final_text}

    except Exception as e:
        # If anything goes wrong, send back a detailed error message
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")