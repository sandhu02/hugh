from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from .htmlParser import htmlParser

def crawl(site_config, keywords):
    # Chrome Path
    chrome_driver_path = r"C:\D-drive-53140\chromedriver-win64\chromedriver.exe"
    # Setup Chrome
    service = Service(chrome_driver_path)
    options = webdriver.ChromeOptions()

    options.add_argument("--headless=new")  # newer, more reliable headless mode
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")  # force a large viewport
    options.add_argument("--ignore-certificate-errors")
    options.add_argument("--ignore-ssl-errors")
    options.add_argument("--disable-web-security")
    options.add_argument("--allow-running-insecure-content")
    options.add_argument("--disable-blink-features=AutomationControlled")  # less detectable

    page_to_scrape = webdriver.Chrome(service=service, options=options)


    page_to_scrape.execute_cdp_cmd(
        "Network.setUserAgentOverride",
        {"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/122.0.0.0 Safari/537.36"}
    )


    selectors = site_config["selectors"]
    base_url = site_config["urls"][0]

    results = []

    page_to_scrape.get(base_url)

    # Wait for DOM to load (adjust selector if needed)
    try:
        WebDriverWait(page_to_scrape, 10).until(
            EC.presence_of_all_elements_located((By.TAG_NAME, "body"))
        )
    except:
        print(f"[WARNING] Timeout waiting for {base_url}")

    # Get fully rendered HTML and parse with BeautifulSoup
    html = page_to_scrape.page_source

    results = htmlParser(html, base_url, selectors, keywords)

    page_to_scrape.quit()

    return results
    
