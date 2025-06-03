from flask import jsonify
import logging

def handle_error(error):
    logging.error(f"Error occurred: {str(error)}")
    return jsonify({"error": f"Server error: {str(error)}"}), 500