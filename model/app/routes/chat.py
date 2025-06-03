from flask import Blueprint, request, jsonify
from ..services.genai_service import generate_hackathon_response
from ..services.conversation import ConversationService
from ..utils.error_handler import handle_error
import uuid

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/api/chat', methods=['POST'])
def handle_hackathon_query():
    try:
        print("Received request to /api/chat endpoint")
        print("DEBUG TYPES:", {k: type(v).__name__ for k, v in request.get_json().items()})
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({"error": "Missing 'query' in request body"}), 400
        if not data or 'session_id' not in data:
            return jsonify({"error": "Missing 'session_id' in request body"}), 400
        user_session_id = data['session_id']
        user_query = data['query']
        user_id = data.get('user_id', 'default_user')

        conversation_service = ConversationService()
        try:
            response = generate_hackathon_response(user_id, user_session_id, user_query)
            return jsonify({"response": response, "session_id": user_session_id})
        finally:
            conversation_service.close()

    except Exception as e:
        return handle_error(e)
    
@chat_bp.route('/api/remove-chat', methods=['POST'])
def remove_chat():
    try:
        data = request.get_json()
        if not data or 'session_id' not in data:
            return jsonify({"error": "Missing 'session_id' in request body"}), 400
            
        session_id = data['session_id']
        conversation_service = ConversationService()
        conversation_service.remove_conversation(session_id)
        return jsonify({"message": "Chat removed successfully"}), 200
        
    except Exception as e:
        return handle_error(e)


@chat_bp.route('/ping', methods=['GET', 'HEAD'], strict_slashes=False)
def ping():
    return jsonify({"message": "Server is up and running"}), 200