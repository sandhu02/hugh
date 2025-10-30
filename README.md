How to run:
1. Clone Project 
2. Add these environment variables in ./dashboard/api/.env
  OPENAI_API_KEY=your_openai_api_key
  DATABASE_URL=sqlite:///scraper.db
  FLASK_ENV=development
  FLASK_DEBUG=True

3. Run pip install -r requirements.txt
4. Run project by running this in root of project:
    python ./dashboard/api/app.py 
    
  
