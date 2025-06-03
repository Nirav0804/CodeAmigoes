from groq import Groq
from .conversation import ConversationService
from ..config import Config
import logging
import os
import inspect

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def initialize_groq():
    logger.debug("Initializing Groq client with api_key=%s", Config.GROQ_API_KEY)
    logger.debug("Environment HTTP_PROXY: %s", os.environ.get('HTTP_PROXY'))
    logger.debug("Environment HTTPS_PROXY: %s", os.environ.get('HTTPS_PROXY'))
    
    try:
        # Define only valid kwargs for Groq client
        kwargs = {
            "api_key": Config.GROQ_API_KEY,
            # Add other supported arguments if needed (like base_url, timeout, etc.)
        }

        # Dynamically filter kwargs based on Groq.__init__ signature
        valid_keys = inspect.signature(Groq.__init__).parameters.keys()
        filtered_kwargs = {k: v for k, v in kwargs.items() if k in valid_keys}

        logger.debug("Groq client kwargs (filtered): %s", filtered_kwargs)
        logger.debug("Groq.__init__ parameters: %s", valid_keys)

        client = Groq(**filtered_kwargs)
        logger.debug("Groq client initialized successfully")
        return client

    except Exception as e:
        logger.error("Failed to initialize Groq client: %s", str(e))
        raise


def get_system_instruction():
    return {
        "role": "system",
        "content": """You are a friendly and helpful chatbot assistant named CodeAmigosBot, built to guide developers in finding the best hackathons. When a user asks about hackathons, respond in an enthusiastic and encouraging tone. Always provide 3–5 recent and relevant hackathon links from the Devfolio website (https://devfolio.co) where registration deadlines, start dates, end dates, and other relevant milestones (e.g., submission deadlines, result announcements) are explicitly available. For each hackathon, include:
Notable themes (e.g., AI, Web3, Open Innovation, Web Development).
All available dates (e.g., registration deadline, start date, end date, submission deadline).
Registration links (direct URLs to the hackathon’s Devfolio page).
Only include hackathons with confirmed, specific dates for all required fields (registration deadline, start date, end date, and any other relevant milestones). Do not include hackathons with missing or unspecified dates. If fewer than 3 hackathons meet these criteria for the requested time or theme (e.g., September 2025), include as many as available (minimum 1) and direct users to https://devfolio.co/hackathons to explore more events. Keep responses short, clear, and action-driven. Use emojis (e.g., 🔗 for links, 🚀 for exciting events) to make it engaging. Avoid complex jargon—keep it beginner-friendly and motivating. Do not use placeholder phrases or mention missing information (e.g., "not specified"). Always provide real links from Devfolio."""
    }

def generate_hackathon_response(user_id, session_id, user_query):
    logger.debug("Generating response for query: %s", user_query)
    client = initialize_groq()
    model = "llama-3.1-8b-instant"
    conversation_service = ConversationService()
    
    conversation_service.append_to_conversation_history(
        user_id, 
        session_id, 
        user_query,
        "user"
    )

    try:
        conversation_history = conversation_service.get_conversation_history(session_id,"user")
        messages = [get_system_instruction()] + conversation_history
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=False
        )
        response_text = response.choices[0].message.content
        
        conversation_service.append_to_conversation_history(
            user_id, 
            session_id,
            response_text,
            "assistant"
        )
        
        return response_text

    except Exception as e:
        logger.error("Error generating response: %s", str(e))
        conversation_service.collection.delete_one({
            "session_id": session_id, 
            "role": "user", 
            "content": user_query
        })
        raise
    finally:
        conversation_service.close()