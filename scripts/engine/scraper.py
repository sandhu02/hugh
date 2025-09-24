import yaml
import json
import os
import csv
import concurrent.futures
from .searchers import searcher
from .homeFetch import home_fetch
from .crawl import crawl
import time
from datetime import datetime, timezone

def scraper():
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # goes up from engine/ to scripts/
    ADAPTERS_DIR = os.path.join(BASE_DIR, "adapters")
    STORAGE_DIR = os.path.join(BASE_DIR, "storage")
    LOGS_DIR = os.path.join(BASE_DIR, "logs")
    yaml_path = os.path.join(ADAPTERS_DIR, "sites.yaml")
    filters_path = os.path.join(ADAPTERS_DIR, "rules", "filters.json")
    log_path = os.path.join(LOGS_DIR, "logs.json")

    os.makedirs(LOGS_DIR, exist_ok=True)
    os.makedirs(STORAGE_DIR, exist_ok=True)

    with open(yaml_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    with open(filters_path, "r", encoding="utf-8") as f:
        filters = json.load(f)

    keywords = filters.get("keywords", [])

    csv_filename = f"scraped_data.csv"
    csv_path = os.path.join(STORAGE_DIR, csv_filename)
    fieldnames = ["site", "keyword", "title", "url", "snippet", "date", "image", "section"]

    start_time = datetime.now(timezone.utc)
    start_ts = time.time()

    combined_results = []

    # run in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(process_site, name, cfg, keywords) for name, cfg in config.items()]
        for future in concurrent.futures.as_completed(futures):
            try:
                combined_results.extend(future.result())
            except Exception as e:
                print(f"[ERROR] Thread execution failed: {e}")

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

    # --- end timer ---
    end_time = datetime.now(timezone.utc)
    end_ts = time.time()
    duration = round(end_ts - start_ts, 2)

    # --- summary log ---
    log_entry = {
        "scrape_start": start_time.isoformat() + "Z",
        "scrape_end": end_time.isoformat() + "Z",
        "duration_seconds": duration,
        "sites_scraped": len(config),
        "results_collected": len(combined_results),
        "scrape_modes": ["home_fetch", "crawl"]
    }

    # append to logs.json (array of runs)
    if os.path.exists(log_path):
        try:
            with open(log_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
            if not isinstance(existing, list):
                existing = [existing]
        except json.JSONDecodeError:
            existing = []
    else:
        existing = []

    existing.append(log_entry)

    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2)

    print(f"Done! Wrote {len(combined_results)} results to {csv_path}")
    print(f"Log saved to {log_path}")

    return combined_results 



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

            elif mode == "crawl":  #crawl
                site_results.extend(crawl(site_config, keywords))

        except Exception as e:
            print(f"[ERROR] {mode} failed for {site_name}: {e}")
            continue

    for r in site_results:
        r["site"] = site_name  # add site name for CSV
    return site_results

