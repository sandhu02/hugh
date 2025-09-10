from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time
from selenium.common.exceptions import NoSuchElementException
import yaml
import os

chrome_driver_path = r"C:\D-drive-53140\chromedriver-win64\chromedriver.exe"
BASE_DIR = os.path.dirname(os.path.dirname(__file__))   # goes up from engine/ to scripts/
ADAPTERS_DIR = os.path.join(BASE_DIR, "adapters")
yaml_path = os.path.join(ADAPTERS_DIR, "sites.yaml")


# Initialize browser
service = Service(chrome_driver_path)
options = webdriver.ChromeOptions()
options.add_argument("--start-maximized")   # Optional
options.add_argument("--ignore-certificate-errors")
options.add_argument("--ignore-ssl-errors")
options.add_argument("--disable-web-security")
options.add_argument("--allow-running-insecure-content")
page_to_scrape = webdriver.Chrome(service=service, options=options)

# Open yaml file
with open(yaml_path, "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)

for site_name, site_config  in config.items():
    if not site_config:  # skip sites with no config
        print(f"Skipping {site_name}, no config provided")
        continue

    urls = site_config.get("urls", [])
    for url in urls:
        page_to_scrape.get(url)

        if "headline_element" in site_config:
            for element in site_config["headline_element"]:
                class_name = element["class"]
                tag_name = element.get("tag")

                headlines = page_to_scrape.find_elements(By.CLASS_NAME, class_name)
                for h in headlines:
                    if tag_name == "a":
                        print(h.text, h.get_attribute("href"))
                    else:
                        print(h.text)
        else:
            print(f"No headline_element defined for {site_name}")


