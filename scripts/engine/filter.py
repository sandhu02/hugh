import re

def keywords_in_title(news_headline_title, keywords):
    """
    Returns a list of keywords that exist in the given title.
    Uses word boundaries to avoid partial matches.
    If none are found, returns None.
    """
    if not news_headline_title:
        return None

    found_keywords = []
    title_lower = news_headline_title.lower()

    for kw in keywords:
        # \b ensures full word match (case-insensitive)
        if re.search(rf"\b{re.escape(kw.lower())}\b", title_lower):
            found_keywords.append(kw)

    return found_keywords if found_keywords else None
