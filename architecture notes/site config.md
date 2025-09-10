# adapters/sites.yaml
afr_com_au:
  modes: [rss, search]
  rss:
    urls:
      - https://www.afr.com/rss
  search:
    url_template: "https://www.afr.com/search?text={query}&page={page}"
    page_start: 1
    page_stop: 3
  selectors:
    item: "article, .StoryFeedItem"
    title: "h3, h2"
    url: "a::attr(href)"
    date: "time::attr(datetime)"
    snippet: "p, .Summary"
  throttle:
    request_interval_ms: 1200
    concurrent: 1

smh_com_au:
  modes: [search]
  search:
    url_template: "https://www.smh.com.au/search?text={query}&page={page}"
    page_start: 1
    page_stop: 2
  selectors:
    item: "li.result"
    title: "a"
    url: "a::attr(href)"
    date: "time::attr(datetime)"
    snippet: ".teaser"
  throttle:
    request_interval_ms: 1200

businessnews_com_au:
  modes: [rss]
  rss:
    urls:
      - https://www.businessnews.com.au/rss
  throttle:
    request_interval_ms: 1000
