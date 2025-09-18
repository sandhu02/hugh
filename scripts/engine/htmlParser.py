from bs4 import BeautifulSoup
from get_element_value import get_element_value
from filter import keywords_in_title
from urllib.parse import urljoin

def htmlParser(html, base_url, selectors, keywords):
    results = []

    soup = BeautifulSoup(html, "html.parser")
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
                "site": "",
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
