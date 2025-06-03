from datetime import datetime
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
def conversation_to_dict(content, user_id, session_id,role):
    logger.debug("%s",content)
    logger.debug("%s",user_id)
    logger.debug("%s",session_id)
    logger.debug("%s",role)
    return {
        "user_id": user_id,
        "session_id": session_id,
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow()
    }

def dict_to_conversation(doc):
    return {
        "role": doc["role"],
        "content": doc["content"]
    }