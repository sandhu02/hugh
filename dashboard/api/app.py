
from flask import Flask, render_template, jsonify , request
from flask_sqlalchemy import SQLAlchemy
import os, sys
import json
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, BASE_DIR)

from scripts.engine.scraper import scraper


load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))



# Build the full path to logs.json
LOGS_PATH = os.path.join(BASE_DIR, "scripts", "logs", "logs.json")


app = Flask(__name__)

# app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///scraper.db"
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# DB Model
class ScrapedData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    site = db.Column(db.String(100))
    keyword = db.Column(db.String(100))
    title = db.Column(db.Text)
    url = db.Column(db.Text)
    snippet = db.Column(db.Text)
    date = db.Column(db.String(50))
    image = db.Column(db.Text)
    section = db.Column(db.String(100))
    relevance = db.Column(db.String(20))

with app.app_context():
    db.create_all()

# Serve homepage
@app.route("/")
def index():
    data = ScrapedData.query.all()
    print(f"DEBUG: Fetched {len(data)} records from DB")
    return render_template("index.html", data=data)



# API: Refresh Scraper
@app.route("/refresh-scraper", methods=["GET"])
def refresh_scraper():
    # delete old data
    ScrapedData.query.delete()
    db.session.commit()

    # run scraper
    results = scraper()
    print("number of scrasped results:", len(results))
    # print("DEBUG scraper results:", results[:2])

    # --- Step 1: Send results to GPT for relevance marking ---
    prompt = """
    You are a financial analyst AI. 
    Mark the relevance of each article title for bankruptcy signals of a company in Europe.
    Use ONLY one of these values: "High", "Medium", "Low".
    Do not remove or group any objects.  
    Return EXACTLY the same number of objects as received, preserving order.
    
    Return STRICT JSON in this exact format:
    {
      "results": [
        {
          "site": "...",
          "keywords": "...",
          "title": "...",
          "url": "...",
          "snippet": "...",
          "date": "...",
          "image": "...",
          "section": "...",
          "relevance": "High" | "Medium" | "Low"
        }
      ]
    }
    """

    gpt_input = json.dumps(results)  # limit size
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": gpt_input}
        ],
        response_format={"type": "json_object"}
    )



    # Parse GPT response
    response_text = response.choices[0].message.content
    try:
        enriched_results = json.loads(response_text)
        if isinstance(enriched_results, dict) and "results" in enriched_results:
            enriched_results = enriched_results["results"]
    except Exception as e:
        print("JSON parse failed:", e, response_text)
        enriched_results = results

   

    # print("DEBUG enriched results:", enriched_results[:2])
    print("number of enriched results:", len(enriched_results))
    # insert new data
    for r in enriched_results:
        if not isinstance(r, dict):
            print("Skipping non-dict:", r)
            continue

        entry = ScrapedData(
            site=r.get("site"),
            keyword=r.get("keywords"),
            title=r.get("title"),
            url=r.get("url"),
            snippet=r.get("snippet"),
            date=r.get("date"),
            image=r.get("image"),
            section=r.get("section"),
            relevance=r.get("relevance"),
        )
        db.session.add(entry)

    db.session.commit()
    return jsonify({"message": f"Stored {len(enriched_results)} new results", "data": enriched_results})



# Render logs page
@app.route("/logs-page-render", methods=["GET"])
def render_logs_page():
    return render_template("logs.html")


#API get logs that matches the date comes in query with the request

@app.route("/get-logs", methods=["GET"])
def get_logs():
    query_date = request.args.get("date")  # format: YYYY-MM-DD

    try:
        with open(LOGS_PATH, "r", encoding="utf-8") as f:
            logs_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        logs_data = []

    filtered_logs = []

    for log in logs_data:
        scrape_start = log.get("scrape_start", "")

        if scrape_start:
            # normalize string (remove Z and timezone)
            clean_str = scrape_start.replace("Z", "").split("+")[0]

            try:
                dt = datetime.fromisoformat(clean_str)
                log_date = dt.strftime("%Y-%m-%d")  # only date part
            except Exception:
                log_date = scrape_start[:10]  # fallback

            if not query_date or log_date == query_date:
                filtered_logs.append(log)

    return jsonify({"logs": filtered_logs})




if __name__ == '__main__':
    app.run(debug=True)