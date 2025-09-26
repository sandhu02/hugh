/scripts/
  engine/
    crawl.py                # Or Scrapy spiders entry
    searchers.py             # RSS, search, sitemap, static HTML
    home_fetch.py
    normalize.py            # title/url/date/snippet cleanup
    rules.py                # keyword & scoring
    dedupe.py               # URL+title hashing
    rate.py                 # per-domain throttling
    render.py               # optional Playwright gate
  adapters/
    sites.yaml              # master registry (see sample below)
    rules/
      filters.json          # keywords, weights, regexes
      stopwords.txt
  /logs/
    logs.json    
  storage/
    store.py                # SQLite or LiteFS; JSONL fallback
  jobs/
    schedule.py             # cron/APS/Arq, per-site frequency
/dashboard/
  api/
    instance/
    static/
    templates/
    app.py                  # Flask/FastAPI read-only endpoints
