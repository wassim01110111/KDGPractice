import http.server
import os
import socketserver
import sys
import threading
import tkinter as tk
import webbrowser
from tkinter import messagebox

PORT = 36767
HOST = "127.0.0.1"
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")

if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")
# Find folder containing the EXE or Python script
if getattr(sys, "frozen", False):
    DIRECTORY = os.path.dirname(sys.executable)
else:
    DIRECTORY = os.path.dirname(os.path.abspath(__file__))

INDEX = os.path.join(DIRECTORY, "index.html")


def show_error(title, message):
    root = tk.Tk()
    root.withdraw()
    messagebox.showerror(title, message)
    root.destroy()


# Check index.html
if not os.path.isfile(INDEX):
    show_error(
        "Server Error", f"Could not find index.html!\n\nExpected location:\n{INDEX}"
    )
    sys.exit(1)


os.chdir(DIRECTORY)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store")
        super().end_headers()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


try:
    # Create and bind server
    server = Server((HOST, PORT), Handler)

    # Start server in background thread
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    # Open browser after server starts
    webbrowser.open(f"http://localhost:{PORT}/")

    # Keep application alive
    thread.join()

except OSError as e:
    show_error("Server Error", f"Could not start server on port {PORT}.\n\nError: {e}")

except Exception as e:
    show_error("Unexpected Error", str(e))

finally:
    if "server" in locals():
        server.shutdown()
        server.server_close()
