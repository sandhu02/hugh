import requests
from htmlParser import htmlParser

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

    results = htmlParser(response.text , base_url, selectors, keywords)

    return results
     