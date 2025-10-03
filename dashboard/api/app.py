from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os, sys
import json
from datetime import datetime, timezone
from dotenv import load_dotenv
from openai import OpenAI

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, BASE_DIR)

# Import your scraper
try:
    from scripts.engine.scraper import scraper
    SCRAPER_AVAILABLE = True
except ImportError:
    print("Warning: Scraper module not available")
    SCRAPER_AVAILABLE = False
    # Create a mock scraper for testing
    def scraper():
        return [{
            "site": "example.com",
            "keywords": "test,financial",
            "title": "Test Article",
            "url": "https://example.com",
            "snippet": "Test snippet",
            "date": "2024-01-01",
            "image": "",
            "section": "finance"
        }]

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Build the full path to logs.json
LOGS_PATH = os.path.join(BASE_DIR, "scripts", "logs", "logs.json")

app = Flask(__name__)


CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # Allow all origins for API routes
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Database configuration - MUST BE BEFORE db initialization
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///scraper.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize db AFTER app config
db = SQLAlchemy(app)

# DB Models - MUST BE AFTER db initialization
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

class FailedScrapeResults(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    site = db.Column(db.String(255), nullable=False)
    error_message = db.Column(db.Text, nullable=False)
    mode = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))    

class Keyword(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    keyword = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class CustomPrompt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    prompt = db.Column(db.Text, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# Initialize database
with app.app_context():
    db.create_all()
    # Initialize with default keywords if empty
    if Keyword.query.count() == 0:
        default_keywords = [
            "insolvency", "liquidation", "receivership", "voluntary administration",
            "creditor", "winding up", "restructuring", "covenant breach", "bankruptcy",
            "lawsuit", "legal action", "class action", "investigation", "regulatory action",
            "probe", "court", "ceo resign", "cfo resign", "chairman resign", "steps down",
            "leadership shakeup", "executive exit", "profit warning", "earnings downgrade",
            "going concern", "capital raise", "cash burn", "guidance miss", "credit downgrade",
            "closure", "shutdown", "redundancy", "layoffs", "staff cuts", "site closure",
            "customer complaint", "refund issue", "failed acquisition", "supplier dispute"
        ]
        for kw in default_keywords:
            db.session.add(Keyword(keyword=kw))
        db.session.commit()
        print(f"Initialized {len(default_keywords)} default keywords")


        # // saving my default prompt in database 
        if CustomPrompt.query.count() == 0:
            default_prompt = """
            You are a financial analyst AI. 
            Your task is to classify news articles based on how strongly they signal bankruptcy or financial distress of a company in Europe.

            Rules for classification:
            - "High": Clear or direct bankruptcy/distress signals.
            Examples: "files for bankruptcy", "liquidation", "default", "CEO resignation due to financial loss", "mass layoffs from financial collapse".
            - "Medium": Indirect but concerning signals.
            Examples: "profit warning", "major revenue decline", "debt restructuring", "credit downgrade".
            - "Low": Weak or unrelated signals.
            Examples: general market news, product launches, management changes without financial cause.

            Use ONLY: "High", "Medium", or "Low".  
            Do not remove or group any objects. Return EXACTLY the same number of objects as received, preserving order.

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
            db.session.add(CustomPrompt(prompt=default_prompt, is_active=True))
            db.session.commit()
            print("Initialized default custom prompt")


# Serve homepage
@app.route("/")
def index():
    return render_template("index.html")

# Serve static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

# API: Get all scrap data for frontend
@app.route("/api/scrap-data", methods=["GET"])
def get_scrap_data():
    try:
        data = ScrapedData.query.all()
        result = []
        for item in data:
            result.append({
                "site": item.site,
                "keywords": item.keyword,
                "title": item.title,
                "url": item.url,
                "snippet": item.snippet,
                "date": item.date,
                "image": item.image,
                "section": item.section,
                "relevance": item.relevance
            })
        return jsonify({"data": result})
    except Exception as e:
        print(f"Error in /api/scrap-data: {e}")
        return jsonify({"error": str(e), "data": []}), 500


# API: Get all failed scrape results for frontend
@app.route("/api/failed-results", methods=["GET"])  
def get_failed_results():
    try:
        data = FailedScrapeResults.query.all()
        result = []
        for item in data:
            result.append({
                "site": item.site,
                "mode": item.mode,
                "error_message": item.error_message,
            })
        return jsonify({"data": result})
    except Exception as e:
        print(f"Error in /api/failed_results: {e}")
        return jsonify({"error": str(e), "data": []}), 500
    

# API: Refresh Scraper with custom prompt support
@app.route("/api/refresh-scraper", methods=["GET"])
def refresh_scraper():
    try:
        if not SCRAPER_AVAILABLE:
            return jsonify({"error": "Scraper module not available", "data": []}), 500

        # delete old data
        ScrapedData.query.delete()
        FailedScrapeResults.query.delete()
        db.session.commit()

        # run scraper
        scraper_output = scraper()
        results = scraper_output.get("success_results", [])         # success results
        failed_results = scraper_output.get("failed_results", [])    # failed results
        print("number of scraped results:", len(results))

        # Get active custom prompt if exists
        active_prompt = CustomPrompt.query.filter_by(is_active=True).first()
        custom_prompt_text = active_prompt.prompt if active_prompt else None

        # Build the GPT prompt
        if custom_prompt_text:
            # Use custom prompt
            prompt = f"""
            {custom_prompt_text}

            Additional Instructions:
            - Classify each article's relevance as "High", "Medium", or "Low"
            - Return EXACTLY the same number of objects as received, preserving order
            - Maintain the original structure and all fields

            Return STRICT JSON in this exact format:
            {{
            "results": [
                {{
                "site": "...",
                "keywords": "...", 
                "title": "...",
                "url": "...",
                "snippet": "...",
                "date": "...",
                "image": "...",
                "section": "...",
                "relevance": "High" | "Medium" | "Low"
                }}
            ]
            }}
            """
            print("Using custom prompt for GPT analysis")
        else:
            # Use default prompt
            prompt = """
            You are a financial analyst AI. 
            Your task is to classify news articles based on how strongly they signal bankruptcy or financial distress of a company in Europe.

            Rules for classification:
            - "High": Clear or direct bankruptcy/distress signals.
            Examples: "files for bankruptcy", "liquidation", "default", "CEO resignation due to financial loss", "mass layoffs from financial collapse".
            - "Medium": Indirect but concerning signals.
            Examples: "profit warning", "major revenue decline", "debt restructuring", "credit downgrade".
            - "Low": Weak or unrelated signals.
            Examples: general market news, product launches, management changes without financial cause.

            Use ONLY: "High", "Medium", or "Low".  
            Do not remove or group any objects. Return EXACTLY the same number of objects as received, preserving order.

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
            print("Using default prompt for GPT analysis")

        # If no OpenAI key, return results directly
        if not os.getenv("OPENAI_API_KEY"):
            print("OpenAI API key not found, skipping GPT analysis")
            enriched_results = results
        else:
            gpt_input = json.dumps(results)
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
                relevance=r.get("relevance", "Low"),
            )
            db.session.add(entry)

        for f in failed_results:
            entry = FailedScrapeResults(
                site=f.get("site"),
                error_message=f.get("error"),
                mode=f.get("mode")
            )
            db.session.add(entry)

        db.session.commit()
        
        response_data = {
            "message": f"Stored {len(enriched_results)} new results", 
            "data": enriched_results
        }
        
        if custom_prompt_text:
            response_data["prompt_used"] = custom_prompt_text
            
        return jsonify(response_data)
    
    except Exception as e:
        print(f"Error in refresh-scraper: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# API: Get keywords
@app.route("/api/get-keywords", methods=["GET"])
def get_keywords():
    try:
        keywords = Keyword.query.all()
        keyword_list = [kw.keyword for kw in keywords]
        return jsonify({"keywords": keyword_list})
    except Exception as e:
        print(f"Error getting keywords: {e}")
        return jsonify({"keywords": []})

# API: Save keywords
@app.route("/api/save-keywords", methods=["POST"])
def save_keywords():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        new_keywords = data.get('keywords', [])
        
        # Clear existing keywords
        Keyword.query.delete()
        
        # Add new keywords
        for kw in new_keywords:
            if kw and kw.strip():
                db.session.add(Keyword(keyword=kw.strip()))
        
        db.session.commit()
        return jsonify({
            "message": f"Saved {len(new_keywords)} keywords", 
            "keywords": new_keywords
        })
    
    except Exception as e:
        print(f"Error saving keywords: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# API: Save custom prompt
@app.route("/api/save-prompt", methods=["POST"])
def save_prompt():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        prompt_text = data.get('prompt', '').strip()
        
        if not prompt_text:
            return jsonify({"error": "No prompt provided"}), 400

        # Deactivate all existing prompts
        CustomPrompt.query.update({'is_active': False})
        
        # Create new active prompt
        new_prompt = CustomPrompt(
            prompt=prompt_text,
            is_active=True
        )
        db.session.add(new_prompt)
        db.session.commit()

        return jsonify({
            "message": "Custom prompt saved and activated",
            "prompt": prompt_text
        })
    
    except Exception as e:
        print(f"Error saving prompt: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# API: Get all prompts
@app.route("/api/get-prompts", methods=["GET"])
def get_prompts():
    try:
        prompts = CustomPrompt.query.order_by(CustomPrompt.created_at.desc()).all()
        result = []
        for prompt in prompts:
            result.append({
                "id": prompt.id,
                "prompt": prompt.prompt,
                "is_active": prompt.is_active,
                "created_at": prompt.created_at.isoformat()
            })
        return jsonify({"prompts": result})
    except Exception as e:
        print(f"Error getting prompts: {e}")
        return jsonify({"prompts": []})

# API: Delete prompt
@app.route("/api/delete-prompt/<int:prompt_id>", methods=["DELETE"])
def delete_prompt(prompt_id):
    try:
        prompt = CustomPrompt.query.get(prompt_id)
        if not prompt:
            return jsonify({"error": "Prompt not found"}), 404
            
        db.session.delete(prompt)
        db.session.commit()
        
        return jsonify({"message": "Prompt deleted successfully"})
    
    except Exception as e:
        print(f"Error deleting prompt: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# API get logs
@app.route("/api/get-logs", methods=["GET"])
def get_logs():
    try:
        query_date = request.args.get("date")

        # If logs file doesn't exist, return sample data for testing
        if not os.path.exists(LOGS_PATH):
            sample_logs = [{
                "scrape_start": datetime.now(timezone.utc).isoformat(),
                "scrape_end": datetime.now(timezone.utc).isoformat(),
                "duration_seconds": 120,
                "sites_scraped": 5,
                "results_collected": 50,
                "scrape_modes": "headless,api"
            }]
            return jsonify({"logs": sample_logs})

        with open(LOGS_PATH, "r", encoding="utf-8") as f:
            logs_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        logs_data = []

    filtered_logs = []

    for log in logs_data:
        scrape_start = log.get("scrape_start", "")

        if scrape_start:
            clean_str = scrape_start.replace("Z", "").split("+")[0]

            try:
                dt = datetime.fromisoformat(clean_str)
                log_date = dt.strftime("%Y-%m-%d")
            except Exception:
                log_date = scrape_start[:10]

            if not query_date or log_date == query_date:
                filtered_logs.append({
                    "scrape_start": log.get("scrape_start"),
                    "scrape_end": log.get("scrape_end"),
                    "duration_seconds": log.get("duration_seconds"),
                    "sites_scraped": log.get("sites_scraped"),
                    "results_collected": log.get("results_collected"),
                    "failed_results": log.get("failed_results"),
                    "scrape_modes": log.get("scrape_modes")
                })

    # Sort logs by scrape_start (latest first)
    filtered_logs.sort(
        key=lambda x: x.get("scrape_start", ""),
        reverse=True
    )            

    return jsonify({"logs": filtered_logs})

# Health check endpoint
@app.route("/api/health", methods=["GET"])
def health_check():
    active_prompt = CustomPrompt.query.filter_by(is_active=True).first()
    
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "scraper_available": SCRAPER_AVAILABLE,
        "active_prompt": bool(active_prompt)
    })

if __name__ == '__main__':
    app.run(debug=True)