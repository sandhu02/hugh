from bs4 import BeautifulSoup

def get_element_value(item, selector, base_url=None):
    """Extracts text or attribute from a BeautifulSoup item using a CSS selector.
    Supports `::attr(attrname)` style selectors."""
    if not selector:
        return ""

    # Check if selector has ::attr()
    if "::attr(" in selector:
        css_selector, attr = selector.split("::attr(")
        attr = attr.rstrip(")")
        element = item.select_one(css_selector.strip())
        return element.get(attr, "").strip() if element else ""
    else:
        element = item.select_one(selector)
        return element.get_text(strip=True) if element else ""