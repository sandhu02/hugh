import os
import csv
import yaml
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException

# Paths
chrome_driver_path = r"C:\D-drive-53140\chromedriver-win64\chromedriver.exe"
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # goes up from engine/ to scripts/
ADAPTERS_DIR = os.path.join(BASE_DIR, "adapters")
STORAGE_DIR = os.path.join(BASE_DIR, "storage")  # <-- store data here
yaml_path = os.path.join(ADAPTERS_DIR, "sites.yaml")

os.makedirs(STORAGE_DIR, exist_ok=True)  # ensure storage folder exists

# Setup Chrome
service = Service(chrome_driver_path)
options = webdriver.ChromeOptions()
options.add_argument("--start-maximized")
options.add_argument("--ignore-certificate-errors")
options.add_argument("--ignore-ssl-errors")
options.add_argument("--disable-web-security")
options.add_argument("--allow-running-insecure-content")
page_to_scrape = webdriver.Chrome(service=service, options=options)

# Load sites.yaml
with open(yaml_path, "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)

for site_name, site_config in config.items():
    if not site_config:
        print(f"Skipping {site_name}, no config provided")
        continue

    urls = site_config.get("urls", [])
    if not urls:
        print(f"Skipping {site_name}, no URLs found")
        continue

    scraped_rows = []  # collect data for this site

    for url in urls:
        page_to_scrape.get(url)
        time.sleep(2)  # small delay to let page load

        if "headline_element" in site_config:
            for element in site_config["headline_element"]:
                class_name = element["class"]
                tag_name = element.get("tag")
                data_testid = element.get("data-testid")

                try:
                    if class_name:
                        headlines = page_to_scrape.find_elements(By.CLASS_NAME, class_name)
                    elif data_testid:
                        headlines = page_to_scrape.find_elements(By.CSS_SELECTOR, f"[data-testid='{data_testid}']")
                    else:
                        print(f"Skipping element with no selector in {site_name}")
                        continue
                except NoSuchElementException:
                    print(f"No elements found with class {class_name} on {url}")
                    continue

                for h in headlines:
                    text = h.text.strip()
                    href = h.get_attribute("href") if tag_name == "a" else ""
                    if text:  # only store non-empty
                        scraped_rows.append([text, href, url])  # store (headline, link, source url)
        else:
            print(f"No headline_element defined for {site_name}")

    # Save to CSV per site
    if scraped_rows:
        csv_filename = f"{site_name}.csv"
        csv_path = os.path.join(STORAGE_DIR, csv_filename)

        with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(["headline", "link", "source_url"])  # header row
            writer.writerows(scraped_rows)

        print(f"[✓] Saved {len(scraped_rows)} headlines to {csv_path}")
    else:
        print(f"[!] No headlines scraped for {site_name}")

page_to_scrape.quit()
