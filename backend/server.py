from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import openai
import json
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI configuration
openai.api_key = os.environ.get('OPENAI_API_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    message: str
    response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_offline: bool = False

class ChatRequest(BaseModel):
    message: str
    user_id: str = "anonymous"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    name: str

# Health facts for offline mode
HEALTH_FACTS = [
    {
        "keywords": ["anxiety", "worry", "stress", "panic"],
        "response": "For anxiety, try the 4-7-8 breathing technique: breathe in for 4 counts, hold for 7, exhale for 8. Practice mindfulness and grounding exercises. If symptoms persist, please consult a healthcare professional."
    },
    {
        "keywords": ["depression", "sad", "hopeless", "down"],
        "response": "Depression is treatable. Try to maintain a routine, get sunlight, exercise regularly, and stay connected with loved ones. Please reach out to a mental health professional for proper support."
    },
    {
        "keywords": ["headache", "pain", "migraine"],
        "response": "For headaches, try drinking water, resting in a quiet dark room, and applying a cold compress. If headaches are severe or frequent, please consult a doctor."
    },
    {
        "keywords": ["fever", "temperature", "hot"],
        "response": "For fever, rest and drink plenty of fluids. Use cool compresses. If temperature is above 38.5°C (101°F) or persists, seek medical attention immediately."
    },
    {
        "keywords": ["emergency", "urgent", "help", "serious"],
        "response": "If this is a medical emergency, please call emergency services immediately (911, 999, or your local emergency number). For mental health crisis, contact a crisis helpline in your area."
    },
    {
        "keywords": ["sleep", "insomnia", "tired"],
        "response": "For better sleep, maintain a regular sleep schedule, avoid screens before bed, keep your room cool and dark, and try relaxation techniques like deep breathing or meditation."
    }
]

def get_offline_response(message: str) -> str:
    """Get offline response based on health facts"""
    message_lower = message.lower()
    
    for fact in HEALTH_FACTS:
        if any(keyword in message_lower for keyword in fact["keywords"]):
            return f"🏥 {fact['response']} \n\n(This is an offline response from Shujaa's health database)"
    
    return "I'm currently offline, but I'm here to help! For general health concerns, please consider consulting a healthcare professional. If this is an emergency, please contact emergency services immediately."

async def get_ai_response(message: str) -> tuple[str, bool]:
    """Get AI response with fallback to offline mode"""
    try:
        # System prompt for Shujaa Health Care
        system_prompt = """You are Shujaa, an AI health assistant for East Africa. You provide compassionate, culturally-sensitive health guidance focusing on mental health and basic medical advice.

Key guidelines:
- Always be empathetic and understanding
- Provide practical, actionable advice
- Recommend professional help when needed
- Be aware of East African cultural context
- Never diagnose or replace professional medical care
- For emergencies, always direct to emergency services
- Use encouraging, hopeful language
- Keep responses concise but thorough

Remember: You're a caring health companion, not a doctor."""

        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content, False
    except Exception as e:
        logging.error(f"OpenAI API error: {e}")
        return get_offline_response(message), True

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Welcome to Shujaa Health Care API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/chat")
async def chat_with_ai(chat_request: ChatRequest):
    try:
        # Get AI response
        ai_response, is_offline = await get_ai_response(chat_request.message)
        
        # Create chat record
        chat_message = ChatMessage(
            user_id=chat_request.user_id,
            message=chat_request.message,
            response=ai_response,
            is_offline=is_offline
        )
        
        # Save to database
        await db.chat_messages.insert_one(chat_message.dict())
        
        return {
            "response": ai_response,
            "is_offline": is_offline,
            "chat_id": chat_message.id
        }
    except Exception as e:
        logging.error(f"Chat error: {e}")
        offline_response = get_offline_response(chat_request.message)
        return {
            "response": offline_response,
            "is_offline": True,
            "error": "Service temporarily unavailable"
        }

@api_router.get("/chat/history/{user_id}")
async def get_chat_history(user_id: str):
    try:
        chat_history = await db.chat_messages.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(50).to_list(50)
        
        return [ChatMessage(**chat) for chat in chat_history]
    except Exception as e:
        logging.error(f"Error fetching chat history: {e}")
        return []

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    try:
        user = User(**user_data.dict())
        await db.users.insert_one(user.dict())
        return user
    except Exception as e:
        logging.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Error creating user")

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": "connected",
        "ai_service": "ready"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()