import http.server
import socketserver
import json
import logging
from pathlib import Path
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load security headers
try:
    with open('security-headers.json', 'r') as f:
        SECURITY_HEADERS = json.load(f)
except FileNotFoundError:
    logger.error("Security headers configuration file not found")
    SECURITY_HEADERS = {}
except json.JSONDecodeError:
    logger.error("Invalid security headers configuration")
    SECURITY_HEADERS = {}

class SecureHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Apply security headers
        for header, value in SECURITY_HEADERS.items():
            self.send_header(header, value)
        super().end_headers()

    def log_message(self, format: str, *args: Any) -> None:
        logger.info(format % args)

    def log_error(self, format: str, *args: Any) -> None:
        logger.error(format % args)

    def handle_error(self, request: Any, client_address: tuple) -> None:
        logger.error(f"Error handling request from {client_address}")

def run_server(start_port: int = 5006, max_attempts: int = 10) -> None:
    """
    Attempts to start the server on the specified port, incrementing the port number
    if it's already in use, up to max_attempts times.
    """
    for port in range(start_port, start_port + max_attempts):
        try:
            # Allow immediate reuse of the address
            socketserver.TCPServer.allow_reuse_address = True
            with socketserver.TCPServer(("", port), SecureHTTPRequestHandler) as httpd:
                logger.info(f"Starting server at http://localhost:{port}")
                logger.info("Press Ctrl+C to stop the server")
                httpd.serve_forever()
                break
        except OSError as e:
            if e.errno == 48:  # Address already in use
                logger.warning(f"Port {port} is already in use, trying next port...")
                if port == start_port + max_attempts - 1:
                    logger.error("No available ports found")
                    raise
            else:
                logger.error(f"Failed to start server: {e}")
                raise
        except KeyboardInterrupt:
            logger.info("\nServer stopped by user")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise

if __name__ == "__main__":
    run_server() 