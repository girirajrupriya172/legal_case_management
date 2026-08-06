import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User

client = TestClient(app)

def test_forgot_password_endpoint():
    test_email = "test_forgot_pw@lexvault.legal"
    db = SessionLocal()
    try:
        db.query(User).filter(User.email == test_email).delete()
        db.commit()
    finally:
        db.close()

    # Register test user
    reg = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": "Password123!",
        "full_name": "Forgot Password Tester",
        "role": "attorney"
    })
    assert reg.status_code == 201

    # Call forgot password endpoint with Origin header
    res = client.post("/api/v1/auth/forgot-password", json={
        "email": test_email
    }, headers={"Origin": "https://legal-case-management-tau.vercel.app"})

    assert res.status_code == 200
    assert "Recovery instructions have been sent" in res.json()["message"]

    # Cleanup
    db = SessionLocal()
    try:
        db.query(User).filter(User.email == test_email).delete()
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    test_forgot_password_endpoint()
    print("SUCCESS: Forgot Password Endpoint Test Passed!")
