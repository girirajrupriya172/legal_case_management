import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.client import Client


client = TestClient(app)

def setup_test_users():
    """
    Registers and authenticates two distinct test users (User A and User B)
    and returns their authorization headers and user IDs.
    """

    # Unique timestamp-based emails for idempotent test execution
    user_a_email = "usera_test_isolation@lexvault.legal"
    user_b_email = "userb_test_isolation@lexvault.legal"
    password = "TestPassword123!"

    # Clean up existing test users/clients if present
    db = SessionLocal()
    try:
        db.query(User).filter(User.email.in_([user_a_email, user_b_email])).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()

    # Register User A
    res_a = client.post("/api/v1/auth/register", json={
        "email": user_a_email,
        "password": password,
        "full_name": "User Alpha",
        "role": "attorney"
    })
    assert res_a.status_code == 201, f"Failed to register User A: {res_a.text}"

    # Login User A
    login_a = client.post("/api/v1/auth/login", json={
        "email": user_a_email,
        "password": password
    })
    assert login_a.status_code == 200, f"Failed to login User A: {login_a.text}"
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    res_b = client.post("/api/v1/auth/register", json={
        "email": user_b_email,
        "password": password,
        "full_name": "User Beta",
        "role": "attorney"
    })
    assert res_b.status_code == 201, f"Failed to register User B: {res_b.text}"

    # Login User B
    login_b = client.post("/api/v1/auth/login", json={
        "email": user_b_email,
        "password": password
    })

    assert login_b.status_code == 200, f"Failed to login User B: {login_b.text}"
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    yield {
        "headers_a": headers_a,
        "headers_b": headers_b,
        "user_a_email": user_a_email,
        "user_b_email": user_b_email,
    }

    # Teardown clean up
    db = SessionLocal()
    try:
        db.query(User).filter(User.email.in_([user_a_email, user_b_email])).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def test_multi_user_client_data_isolation(setup_test_users):
    headers_a = setup_test_users["headers_a"]
    headers_b = setup_test_users["headers_b"]

    # 1. User A creates Client A1 & Client A2
    res_a1 = client.post("/api/v1/clients", json={
        "full_name": "Client A1 Corp",
        "email": "contact@clienta1.com",
        "phone": "555-0001",
        "address": "100 Alpha Way"
    }, headers=headers_a)
    assert res_a1.status_code == 201, f"Create A1 failed: {res_a1.text}"
    client_a1 = res_a1.json()

    res_a2 = client.post("/api/v1/clients", json={
        "full_name": "Client A2 Inc",
        "email": "contact@clienta2.com",
        "phone": "555-0002",
        "address": "200 Alpha Blvd"
    }, headers=headers_a)
    assert res_a2.status_code == 201, f"Create A2 failed: {res_a2.text}"
    client_a2 = res_a2.json()

    # 2. User B creates Client B1
    res_b1 = client.post("/api/v1/clients", json={
        "full_name": "Client B1 Ltd",
        "email": "contact@clientb1.com",
        "phone": "555-9001",
        "address": "900 Beta Street"
    }, headers=headers_b)
    assert res_b1.status_code == 201, f"Create B1 failed: {res_b1.text}"
    client_b1 = res_b1.json()

    # 3. User A queries clients -> Must see ONLY A1 and A2
    get_a = client.get("/api/v1/clients", headers=headers_a)
    assert get_a.status_code == 200
    items_a = get_a.json()["items"]
    names_a = [c["full_name"] for c in items_a]
    assert "Client A1 Corp" in names_a
    assert "Client A2 Inc" in names_a
    assert "Client B1 Ltd" not in names_a, "SECURITY BREACH: User A can see User B's client!"

    # 4. User B queries clients -> Must see ONLY B1
    get_b = client.get("/api/v1/clients", headers=headers_b)
    assert get_b.status_code == 200
    items_b = get_b.json()["items"]
    names_b = [c["full_name"] for c in items_b]
    assert "Client B1 Ltd" in names_b
    assert "Client A1 Corp" not in names_b, "SECURITY BREACH: User B can see User A's client A1!"
    assert "Client A2 Inc" not in names_b, "SECURITY BREACH: User B can see User A's client A2!"

    # 5. User B attempts to VIEW User A's Client A1 -> Must return 403 Forbidden
    view_unauth = client.get(f"/api/v1/clients/{client_a1['id']}", headers=headers_b)
    assert view_unauth.status_code == 403, f"Expected 403 Forbidden, got {view_unauth.status_code}"

    # 6. User B attempts to UPDATE User A's Client A1 -> Must return 403 Forbidden
    update_unauth = client.put(f"/api/v1/clients/{client_a1['id']}", json={
        "full_name": "Hacked Client A1"
    }, headers=headers_b)
    assert update_unauth.status_code == 403, f"Expected 403 Forbidden, got {update_unauth.status_code}"

    # 7. User B attempts to DELETE User A's Client A1 -> Must return 403 Forbidden
    delete_unauth = client.delete(f"/api/v1/clients/{client_a1['id']}", headers=headers_b)
    assert delete_unauth.status_code == 403, f"Expected 403 Forbidden, got {delete_unauth.status_code}"

    # 8. User A can update and delete their own clients
    update_auth = client.put(f"/api/v1/clients/{client_a1['id']}", json={
        "full_name": "Client A1 Corp Updated"
    }, headers=headers_a)
    assert update_auth.status_code == 200
    assert update_auth.json()["full_name"] == "Client A1 Corp Updated"

    delete_auth = client.delete(f"/api/v1/clients/{client_a2['id']}", headers=headers_a)
    assert delete_auth.status_code == 200

if __name__ == "__main__":
    print("Executing Multi-User Client Data Isolation Test Suite...")
    gen = setup_test_users()
    test_data = next(gen)
    try:
        test_multi_user_client_data_isolation(test_data)
        print("SUCCESS: ALL MULTI-USER CLIENT DATA ISOLATION TESTS PASSED PERFECTLY!")

    finally:
        try:
            next(gen)
        except StopIteration:
            pass

