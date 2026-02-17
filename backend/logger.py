"""
Logging configuration for ParaDetect AI
"""
import logging
import sys
from pathlib import Path
from datetime import datetime

# Create logs directory
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

# Log file with date
LOG_FILE = LOGS_DIR / f"paradetect_{datetime.now().strftime('%Y%m%d')}.log"

# Create formatters
DETAILED_FORMAT = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

SIMPLE_FORMAT = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)

def setup_logger(name: str = "paradetect", level: int = logging.INFO) -> logging.Logger:
    """
    Setup logger with file and console handlers
    
    Args:
        name: Logger name
        level: Logging level
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # File handler (detailed)
    file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(DETAILED_FORMAT)
    logger.addHandler(file_handler)
    
    # Console handler (simple)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(SIMPLE_FORMAT)
    logger.addHandler(console_handler)
    
    return logger

# Global logger instance
logger = setup_logger()

# Convenience functions
def log_info(message: str):
    """Log info message"""
    logger.info(message)

def log_error(message: str, exc_info=False):
    """Log error message"""
    logger.error(message, exc_info=exc_info)

def log_warning(message: str):
    """Log warning message"""
    logger.warning(message)

def log_debug(message: str):
    """Log debug message"""
    logger.debug(message)

def log_critical(message: str):
    """Log critical message"""
    logger.critical(message)
