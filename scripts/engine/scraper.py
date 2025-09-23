import yaml
import json
import os
import csv
import concurrent.futures
from searchers import searcher
from homeFetch import home_fetch
from crawl import crawl

def scraper():
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # goes up from engine/ to scripts/
    ADAPTERS_DIR = os.path.join(BASE_DIR, "adapters")
    STORAGE_DIR = os.path.join(BASE_DIR, "storage")
    yaml_path = os.path.join(ADAPTERS_DIR, "sites.yaml")
    filters_path = os.path.join(ADAPTERS_DIR, "rules", "filters.json")

    os.makedirs(STORAGE_DIR, exist_ok=True)

    with open(yaml_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    with open(filters_path, "r", encoding="utf-8") as f:
        filters = json.load(f)

    keywords = filters.get("keywords", [])

    csv_filename = f"scraped_data.csv"
    csv_path = os.path.join(STORAGE_DIR, csv_filename)
    fieldnames = ["site", "keyword", "title", "url", "snippet", "date", "image", "section"]

    combined_results = []

    # run in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(process_site, name, cfg, keywords) for name, cfg in config.items()]
        for future in concurrent.futures.as_completed(futures):
            combined_results.extend(future.result())

    # write to CSV
    with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for r in combined_results:
            try:
                writer.writerow({
                    "site": r.get("site"),
                    "keyword": r.get("keywords"),
                    "title": r.get("title"),
                    "url": r.get("url"),
                    "snippet": r.get("snippet"),
                    "date": r.get("date"),
                    "image": r.get("image"),
                    "section": r.get("section")
                })
            except Exception as e:
                print(f"[CSV ERROR] Failed to write row: {e} | row={r}")

    print(f"Done! Wrote {len(combined_results)} results to {csv_path}")


# --- worker function

def process_site(site_name, site_config, keywords):
    site_results = []
    if not site_config:
        print(f"Skipping {site_name}, no config provided")
        return []

    modes = site_config.get("modes", [])
    for mode in modes:
        try:
            if mode == "search":
                for keyword in keywords:
                    site_results.extend(searcher(site_config, query=keyword))

            elif mode == "home_fetch":
                site_results.extend(home_fetch(site_config, keywords))

            elif mode == "crawl":
                site_results.extend(crawl(site_config, keywords))

        except Exception as e:
            print(f"[ERROR] {mode} failed for {site_name}: {e}")
            continue

    for r in site_results:
        r["site"] = site_name  # add site name for CSV
    return site_results

