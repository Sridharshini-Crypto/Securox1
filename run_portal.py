import subprocess
import sys
import os
import time

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    print("=" * 70)
    print(" 🛡️  SECUROX ZERO-TRUST GOVERNMENT SECURITY PORTAL")
    print("=" * 70)
    print(f"[*] Backend Directory:  {backend_dir}")
    print(f"[*] Frontend Directory: {frontend_dir}")
    print("\n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...")

    # Start backend
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=backend_dir
    )

    time.sleep(2)
    print("\n[2/2] Starting Vite Frontend on http://localhost:5173 ...")
    
    # Start frontend
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    print("\n" + "=" * 70)
    print("  🚀 PORTAL SERVICES RUNNING")
    print("  ➜ Frontend UI:  http://localhost:5173")
    print("  ➜ Backend API: http://127.0.0.1:8000/docs")
    print("  ➜ SOC Live WS: ws://127.0.0.1:8000/api/security/ws")
    print("=" * 70)
    print("\nPress Ctrl+C to stop all services.")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping portal services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Done.")

if __name__ == "__main__":
    main()

