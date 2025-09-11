import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from get_element_value import get_element_value

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.google.com/",
    "Cache-Control": "no-cache",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Connection": "keep-alive",
}



def searcher(site_config, query=""):
    results = []

    # --- Parse config ---
    url_template = site_config["search"]["url_template"]
    page_start = site_config["search"]["page_start"]
    page_stop = site_config["search"]["page_stop"]
    selectors = site_config["selectors"]
    base_url = site_config["urls"][0]

    for page in range(page_start, page_stop + 1):
        # Build search URL (support {page})
        search_url = url_template.format(query=query)
        if "{page}" in search_url:
            search_url = search_url.replace("{page}", str(page))

        print(f"[DEBUG] Fetching: {search_url}")
        try:
            response = requests.get(search_url, headers=HEADERS,timeout=20)
            response.raise_for_status()
        except requests.RequestException as e:
            print(f"[ERROR] Request failed for {search_url}: {e}")
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        items = soup.select(selectors["item"])
        print(f"[DEBUG] Found {len(items)} items")

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

            results.append({
                "title": title,
                "url": url,
                "snippet": snippet,
                "date": date,
                "image": image,
                "section": section
            })

    return results


# Example usage
# if __name__ == "__main__":
#     site_config = {
#         'modes': ['search'], 'urls': ['https://stockhead.com.au/'], 'search': {'url_template': 'https://stockhead.com.au/?s={query}', 'page_start': 1, 'page_stop': 1}, 'selectors': {'item': 'article.article-item', 'title': 'h2.latest__article__title a', 'url': 'h2.latest__article__title a::attr(href)', 'snippet': None, 'date': 'time.meta__time::attr(datetime)', 'image': 'div.article-item__image-wrapper img::attr(src)', 'section': 'a.meta__category', 'author': 'a.meta__author'}
#     }

#     data = fetcher(site_config, query="startups")
#     for d in data:
#         print(d)
