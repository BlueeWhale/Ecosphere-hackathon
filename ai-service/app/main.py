import os
import sys
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure root directory is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

load_dotenv()

app = FastAPI(
    title="DealPilot AI Service",
    description="Adaptive AI Sales & Negotiation Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "DealPilot AI Service",
        "status": "online"
    }

@app.get("/health")
def health_check():
    return {
        "service": "DealPilot AI Service",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    # Pass app instance directly to avoid module import issues on reload
    uvicorn.run(app, host="0.0.0.0", port=port)