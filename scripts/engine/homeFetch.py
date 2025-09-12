import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from get_element_value import get_element_value
from filter import keywords_in_title


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Connection": "keep-alive",
}

def home_fetch(site_config , keywords):
    results = []

    # --- Parse config ---
    selectors = site_config["selectors"]
    base_url = site_config["urls"][0]

    session = requests.Session()
    session.headers.update(HEADERS)

    try:
        print("[DEBUG] Fetching Home for",base_url)
        response = session.get(base_url ,timeout=20)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"[ERROR] Request failed for {base_url}: {e}")

    soup = BeautifulSoup(response.text, "html.parser")
    items = soup.select(selectors["item"])
    print(f"[COUNT] Found {len(items)} items")

    for item in items:
        title = get_element_value(item, selectors.get("title", ""))
        url = get_element_value(item, selectors.get("url", ""))
        snippet = get_element_value(item, selectors.get("snippet", ""))
        date = get_element_value(item, selectors.get("date", ""))
        image = get_element_value(item, selectors.get("image", ""))
        section = get_element_value(item, selectors.get("section", ""))

        # Normalize relative URLs
        if url and not url.startswith("http"):
            url = urljoin(base_url, url)
        if image and not image.startswith("http"):
            image = urljoin(base_url, image)

        found_keywords = keywords_in_title(title , keywords)

        if (found_keywords):
            keywords_str = ",".join(found_keywords)    # makes a comma separated string of keywords
            news_headline = {
                "keywords": keywords_str,
                "title": title,
                "url": url,
                "snippet": snippet,
                "date": date,
                "image": image,
                "section": section
            } 

            results.append(news_headline)   

    return results
     

