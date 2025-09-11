import yaml
import json
import os
import csv
from searchers import searcher
from homeFetch import home_fetch

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # goes up from engine/ to scripts/
ADAPTERS_DIR = os.path.join(BASE_DIR, "adapters")
STORAGE_DIR = os.path.join(BASE_DIR, "storage")  # <-- store data here
yaml_path = os.path.join(ADAPTERS_DIR, "sites.yaml")
filters_path = os.path.join(ADAPTERS_DIR,"rules", "filters.json")

os.makedirs(STORAGE_DIR, exist_ok=True)

with open(yaml_path, "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)

with open(filters_path, "r", encoding="utf-8") as f:
    filters = json.load(f)

keywords = filters.get("keywords", [])


for site_name, site_config in config.items():
    csv_filename = f"{site_name}.csv"
    csv_path = os.path.join(STORAGE_DIR, csv_filename)
    # Prepare CSV
    fieldnames = ["site", "keyword", "title", "url", "snippet", "date", "image", "section"]
    
    with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        if not site_config:
            print(f"Skipping {site_name}, no config provided")
            continue

        modes = site_config.get("modes", [])
        for mode in modes:
            if mode == "search":
                for keyword in keywords:
                    try:
                        results = searcher(site_config, query=keyword)
                    except Exception as e:
                        print(f"[ERROR] Failed fetching for {site_name} with keyword '{keyword}': {e}")
                        continue

                    for r in results:
                        writer.writerow({
                            "site": site_name,
                            "keyword": keyword,
                            "title": r.get("title"),
                            "url": r.get("url"),
                            "snippet": r.get("snippet"),
                            "date": r.get("date"),
                            "image": r.get("image"),
                            "section": r.get("section")
                        })

            elif mode == "home_fetch":
                try:
                    results = home_fetch(site_config)
                    for r in results:
                        try:
                            writer.writerow({
                                "site": site_name,
                                "keyword": "",  # no keyword in home_fetch mode
                                "title": r.get("title"),
                                "url": r.get("url"),
                                "snippet": r.get("snippet"),
                                "date": r.get("date"),
                                "image": r.get("image"),
                                "section": r.get("section")
                            })
                        except Exception as e:
                            print(f"[CSV ERROR] Failed to write row: {e} | row={r}")
                
                except Exception as e:
                    print(f"[ERROR] Failed fetching for {site_name}")
                    continue

            elif mode == "crawl":
                print("[MESSAGE] No site is using crawl yet")
    