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
    user_a_email = "usera_dashboard_test@lexvault.legal"
    user_b_email = "userb_dashboard_test@lexvault.legal"
    password = "TestPassword123!"

    db = SessionLocal()
    try:
        db.query(User).filter(User.email.in_([user_a_email, user_b_email])).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()

    # Register & Login User A
    client.post("/api/v1/auth/register", json={
        "email": user_a_email,
        "password": password,
        "full_name": "User Dash A",
        "role": "attorney"
    })
    login_a = client.post("/api/v1/auth/login", json={"email": user_a_email, "password": password})
    headers_a = {"Authorization": f"Bearer {login_a.json()['access_token']}"}

    # Register & Login User B
    client.post("/api/v1/auth/register", json={
        "email": user_b_email,
        "password": password,
        "full_name": "User Dash B",
        "role": "attorney"
    })
    login_b = client.post("/api/v1/auth/login", json={"email": user_b_email, "password": password})
    headers_b = {"Authorization": f"Bearer {login_b.json()['access_token']}"}

    yield {
        "headers_a": headers_a,
        "headers_b": headers_b,
        "user_a_email": user_a_email,
        "user_b_email": user_b_email
    }

    db = SessionLocal()
    try:
        db.query(User).filter(User.email.in_([user_a_email, user_b_email])).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def test_dashboard_total_clients_isolation(setup_test_users):
    headers_a = setup_test_users["headers_a"]
    headers_b = setup_test_users["headers_b"]

    # 1. User A starts with 0 clients on dashboard
    dash_a_initial = client.get("/api/v1/dashboard/stats", headers=headers_a)
    assert dash_a_initial.status_code == 200
    assert dash_a_initial.json()["stats"]["total_clients"] == 0

    # 2. User B creates 1 client
    res_b = client.post("/api/v1/clients", json={
        "full_name": "Client of Account B",
        "email": "bclient@test.com",
        "phone": "1234567890",
        "address": "123 B St"
    }, headers=headers_b)
    assert res_b.status_code == 201

    # 3. User B's dashboard shows 1 client
    dash_b = client.get("/api/v1/dashboard/stats", headers=headers_b)
    assert dash_b.status_code == 200
    assert dash_b.json()["stats"]["total_clients"] == 1

    # 4. User A's dashboard MUST still show 0 total clients (NOT 1!)
    dash_a_after_b = client.get("/api/v1/dashboard/stats", headers=headers_a)
    assert dash_a_after_b.status_code == 200
    assert dash_a_after_b.json()["stats"]["total_clients"] == 0, \
        f"Dashboard total_clients breach: User A sees {dash_a_after_b.json()['stats']['total_clients']} instead of 0!"

    # 5. User A creates 2 clients
    client.post("/api/v1/clients", json={
        "full_name": "Client 1 of Account A",
        "email": "a1client@test.com",
        "phone": "1111111111",
        "address": "111 A St"
    }, headers=headers_a)
    client.post("/api/v1/clients", json={
        "full_name": "Client 2 of Account A",
        "email": "a2client@test.com",
        "phone": "2222222222",
        "address": "222 A St"
    }, headers=headers_a)

    # 6. Verify User A dashboard shows 2 total clients, and User B dashboard shows 1 total client
    dash_a_final = client.get("/api/v1/dashboard/stats", headers=headers_a)
    assert dash_a_final.json()["stats"]["total_clients"] == 2

    dash_b_final = client.get("/api/v1/dashboard/stats", headers=headers_b)
    assert dash_b_final.json()["stats"]["total_clients"] == 1


if __name__ == "__main__":
    print("Executing Dashboard Isolation Test Suite...")
    gen = setup_test_users()
    test_data = next(gen)
    try:
        test_dashboard_total_clients_isolation(test_data)
        print("SUCCESS: ALL DASHBOARD ISOLATION TESTS PASSED PERFECTLY!")
    finally:
        try:
            next(gen)
        except StopIteration:
            pass
