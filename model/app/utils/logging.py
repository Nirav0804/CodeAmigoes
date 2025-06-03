
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[
            RotatingFileHandler('hackathon_bot.log', maxBytes=1000000, backupCount=5),
            logging.StreamHandler()
        ]
    )   