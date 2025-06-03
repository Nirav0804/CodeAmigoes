from pymongo import MongoClient
from ..config import Config
from ..models.conversation import conversation_to_dict, dict_to_conversation
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
# Initial conversation history
initial_conversation_history = [
    {
        "role": "user",
        "content": "Are there any upcoming hackathons?"
    },
    {
        "role": "assistant",
        "content": """🚀 Here are some exciting hackathons on Devfolio you might love:

1. **CodeZen 2025 Hackathon** – A thrilling coding marathon with a Web3 and Blockchain track! 🧙‍♂️
   * **Theme:** Web3, Blockchain, AI, Sustainability
   * **Deadline:** Apply by February 15, 2025
   * **Register here:** https://codezen2025.devfolio.co

2. **Hack This Fall 4.0** – A beginner-friendly hackathon to build innovative projects! 🌟
   * **Theme:** Open Innovation, Web Development, Social Impact
   * **Deadline:** Check Devfolio for exact dates
   * **Register here:** https://hackthisfall2024.devfolio.co

3. **Devfolio Hackathons** – More hackathons are listed on Devfolio’s main page!
   * **Theme:** Various (Web Development, AI, Blockchain, etc.)
   * **Deadline:** Varies by event
   * **Register here:** https://devfolio.co/hackathons

🔗 Discover more hackathons on **Devfolio**! Let me know if you'd like help forming a team or boosting your profile! 💪"""
    }
]

class ConversationService:
    def __init__(self): 
        self.client = MongoClient(Config.MONGODB_URI)
        self.db = self.client[Config.MONGODB_DB_NAME]
        self.collection = self.db["conversations"]

    def trim_conversation(self,session_id, role,tokensUsed):
        while(tokensUsed > 10):
            # Remove the oldest conversation entry
            oldest_entry = self.collection.find_one_and_delete(
                {"session_id": session_id},
                sort=[("timestamp", 1)]
            )
            if oldest_entry:
                if(oldest_entry.get("role") == "user"):
                    logger.debug("Removing user entry: %s", oldest_entry)
                    tokensUsed -= len(oldest_entry.get("content", "")) // 4
            if not oldest_entry:
                logger.debug("No more entries to remove")
                break
            logger.debug("Removed oldest entry: %s", oldest_entry)
        return tokensUsed

    def get_conversation_history(self, session_id,role):
        logger.debug("Fetching conversation history for role %s", role)
        # Fetch conversation history for the session
        docs = self.collection.find({"session_id": session_id , "role":role}).sort("timestamp", 1)
        
        # docs_list = list(docs)  # Convert cursor to list
        # logger.debug("Docs from Mongo: %d", len(docs_list))
        # logger.debug("Number of documents fetched")
        history = [dict_to_conversation(doc) for doc in docs]
        # logger.debug("History length: %d", len(history))
        if not history:
            # If no history exists, initialize with default
            for content in initial_conversation_history:
                self.append_to_conversation_history("default_user", session_id, content)
            return initial_conversation_history
        lengthOfContent = 0
        for content in history:
            lengthOfContent += len(content.get("content", ""))
            logger.debug("Content length: %d", lengthOfContent)
            # logger.debug("Content: %s", content)
            # logger.debug("Role: %s", content.get("role"))
            logger.debug("Content: %s", content.get("content"))
        tokensUsed = lengthOfContent // 4  # Rough estimate of tokens
        logger.debug("Total tokens used: %d", tokensUsed)
        if(tokensUsed>10):
            tokensUsed = self.trim_conversation(session_id, role,tokensUsed)
        logger.debug("Length of history: %d",len(history))

        return history

    def append_to_conversation_history(self, user_id, session_id, content,role):
        logger.debug("Appending to conversation history for session %s", session_id)
        logger.debug("Content to append: %s", content)
        logger.debug("User ID: %s", user_id)
        # Store conversation in MongoDB
        self.collection.insert_one(conversation_to_dict(content, user_id, session_id,role))

    def remove_conversation(self, session_id):
        logger.debug("Removing conversation for session %s", session_id)
        # Remove conversation history for the session
        result = self.collection.delete_many({"session_id": session_id})
        if result.deleted_count > 0:
            logger.debug("Removed %d documents for session %s", result.deleted_count, session_id)
        else:
            logger.debug("No documents found to remove for session %s", session_id)

    def close(self):
        self.client.close()