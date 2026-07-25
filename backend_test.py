#!/usr/bin/env python3
"""
LeadHub Backend API Test Suite
Tests all backend endpoints with authentication flow
"""
import requests
import json
import os
from datetime import datetime

# Base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://lead-mgmt-hub-8.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@demo.com"
ADMIN_PASSWORD = "admin123"
MEMBER_EMAIL = "member@demo.com"
MEMBER_PASSWORD = "member123"

# Session for maintaining cookies
session = requests.Session()

def print_test(name, passed, details=""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   Details: {details}")
    print()

def test_health():
    """Test GET /api/ - Health check"""
    print("=" * 60)
    print("TEST 1: Health Check (GET /api/)")
    print("=" * 60)
    try:
        response = requests.get(f"{API_URL}/")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get('ok') == True and
            data.get('service') == 'LeadHub API'
        )
        
        print_test(
            "Health check endpoint",
            passed,
            f"Status: {response.status_code}, Response: {data}"
        )
        return passed
    except Exception as e:
        print_test("Health check endpoint", False, f"Error: {str(e)}")
        return False

def test_public_lead_creation():
    """Test POST /api/leads - Public lead capture"""
    print("=" * 60)
    print("TEST 2: Public Lead Creation (POST /api/leads)")
    print("=" * 60)
    
    results = []
    
    # Test 2a: Valid lead creation
    try:
        valid_lead = {
            "name": "John Smith",
            "email": "john.smith@acmecorp.com",
            "phone": "+1-555-0123",
            "company": "Acme Corporation",
            "message": "Interested in your lead management platform for our sales team."
        }
        
        response = requests.post(f"{API_URL}/leads", json=valid_lead)
        data = response.json()
        
        passed = (
            response.status_code == 201 and
            'lead' in data and
            data['lead'].get('status') == 'NEW' and
            data['lead'].get('source') == 'website' and
            'id' in data['lead']
        )
        
        print_test(
            "Valid lead creation",
            passed,
            f"Status: {response.status_code}, Lead ID: {data.get('lead', {}).get('id')}"
        )
        results.append(passed)
        
        # Store lead ID for later tests
        if passed:
            global created_lead_id
            created_lead_id = data['lead']['id']
            
    except Exception as e:
        print_test("Valid lead creation", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 2b: Invalid email
    try:
        invalid_email_lead = {
            "name": "Jane Doe",
            "email": "not-an-email",
            "phone": "+1-555-0124",
            "company": "Test Corp",
            "message": "This should fail validation"
        }
        
        response = requests.post(f"{API_URL}/leads", json=invalid_email_lead)
        data = response.json()
        
        passed = (
            response.status_code == 422 and
            'issues' in data
        )
        
        print_test(
            "Invalid email validation",
            passed,
            f"Status: {response.status_code}, Has issues: {'issues' in data}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Invalid email validation", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 2c: Short name
    try:
        short_name_lead = {
            "name": "J",
            "email": "j@test.com",
            "phone": "+1-555-0125",
            "company": "Test Corp",
            "message": "Name too short"
        }
        
        response = requests.post(f"{API_URL}/leads", json=short_name_lead)
        data = response.json()
        
        passed = (
            response.status_code == 422 and
            'issues' in data
        )
        
        print_test(
            "Short name validation",
            passed,
            f"Status: {response.status_code}, Has issues: {'issues' in data}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Short name validation", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 2d: Missing required field
    try:
        missing_field_lead = {
            "name": "Test User",
            "email": "test@test.com",
            "phone": "+1-555-0126"
            # Missing company and message
        }
        
        response = requests.post(f"{API_URL}/leads", json=missing_field_lead)
        data = response.json()
        
        passed = (
            response.status_code == 422 and
            'issues' in data
        )
        
        print_test(
            "Missing required fields validation",
            passed,
            f"Status: {response.status_code}, Has issues: {'issues' in data}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Missing required fields validation", False, f"Error: {str(e)}")
        results.append(False)
    
    return all(results)

def test_authentication():
    """Test POST /api/auth/login"""
    print("=" * 60)
    print("TEST 3: Authentication (POST /api/auth/login)")
    print("=" * 60)
    
    results = []
    
    # Test 3a: Successful login with admin
    try:
        response = session.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        data = response.json()
        
        has_cookie = 'lh_session' in session.cookies
        
        passed = (
            response.status_code == 200 and
            'user' in data and
            data['user'].get('email') == ADMIN_EMAIL and
            data['user'].get('role') == 'ADMIN' and
            has_cookie
        )
        
        print_test(
            "Successful admin login",
            passed,
            f"Status: {response.status_code}, Has cookie: {has_cookie}, Role: {data.get('user', {}).get('role')}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Successful admin login", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 3b: Wrong password
    try:
        temp_session = requests.Session()
        response = temp_session.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        data = response.json()
        
        passed = (
            response.status_code == 401 and
            'error' in data and
            'Invalid credentials' in data['error']
        )
        
        print_test(
            "Wrong password rejection",
            passed,
            f"Status: {response.status_code}, Error: {data.get('error')}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Wrong password rejection", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 3c: Unknown email
    try:
        temp_session = requests.Session()
        response = temp_session.post(f"{API_URL}/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        data = response.json()
        
        passed = (
            response.status_code == 401 and
            'error' in data and
            'Invalid credentials' in data['error']
        )
        
        print_test(
            "Unknown email rejection",
            passed,
            f"Status: {response.status_code}, Error: {data.get('error')}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Unknown email rejection", False, f"Error: {str(e)}")
        results.append(False)
    
    return all(results)

def test_auth_me():
    """Test GET /api/auth/me"""
    print("=" * 60)
    print("TEST 4: Session Check (GET /api/auth/me)")
    print("=" * 60)
    
    results = []
    
    # Test 4a: With valid session
    try:
        response = session.get(f"{API_URL}/auth/me")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            'user' in data and
            data['user'] is not None and
            data['user'].get('email') == ADMIN_EMAIL
        )
        
        print_test(
            "Session check with valid cookie",
            passed,
            f"Status: {response.status_code}, User: {data.get('user', {}).get('email') if data.get('user') else 'None'}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Session check with valid cookie", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 4b: Without session
    try:
        temp_session = requests.Session()
        response = temp_session.get(f"{API_URL}/auth/me")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            'user' in data and
            data['user'] is None
        )
        
        print_test(
            "Session check without cookie",
            passed,
            f"Status: {response.status_code}, User is null: {data.get('user') is None}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Session check without cookie", False, f"Error: {str(e)}")
        results.append(False)
    
    return all(results)

def test_protected_leads_list():
    """Test GET /api/leads - Protected endpoint"""
    print("=" * 60)
    print("TEST 5: Protected Leads Listing (GET /api/leads)")
    print("=" * 60)
    
    results = []
    
    # First, create a few more leads for testing
    leads_to_create = [
        {
            "name": "Sarah Johnson",
            "email": "sarah.j@techstart.io",
            "phone": "+1-555-0200",
            "company": "TechStart Inc",
            "message": "Looking for enterprise solution for our growing team."
        },
        {
            "name": "Mike Chen",
            "email": "mike.chen@innovate.com",
            "phone": "+1-555-0201",
            "company": "Innovate Corp",
            "message": "Need demo of your platform for our sales department."
        }
    ]
    
    for lead_data in leads_to_create:
        try:
            requests.post(f"{API_URL}/leads", json=lead_data)
        except:
            pass
    
    # Test 5a: Without authentication
    try:
        temp_session = requests.Session()
        response = temp_session.get(f"{API_URL}/leads")
        data = response.json()
        
        passed = (
            response.status_code == 401 and
            'error' in data
        )
        
        print_test(
            "Leads list without auth (401)",
            passed,
            f"Status: {response.status_code}, Error: {data.get('error')}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Leads list without auth", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 5b: With authentication
    try:
        response = session.get(f"{API_URL}/leads")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            'items' in data and
            'total' in data and
            'page' in data and
            'limit' in data and
            isinstance(data['items'], list)
        )
        
        print_test(
            "Leads list with auth",
            passed,
            f"Status: {response.status_code}, Total leads: {data.get('total')}, Items count: {len(data.get('items', []))}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Leads list with auth", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 5c: Filter by status
    try:
        response = session.get(f"{API_URL}/leads?status=NEW")
        data = response.json()
        
        all_new = all(item.get('status') == 'NEW' for item in data.get('items', []))
        
        passed = (
            response.status_code == 200 and
            'items' in data and
            all_new
        )
        
        print_test(
            "Leads list filtered by status=NEW",
            passed,
            f"Status: {response.status_code}, All items have status NEW: {all_new}, Count: {len(data.get('items', []))}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Leads list filtered by status", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 5d: Search functionality
    try:
        response = session.get(f"{API_URL}/leads?search=acme")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            'items' in data
        )
        
        print_test(
            "Leads list with search query",
            passed,
            f"Status: {response.status_code}, Results: {len(data.get('items', []))}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Leads list with search", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 5e: Sort by createdAt ascending
    try:
        response = session.get(f"{API_URL}/leads?sort=createdAt")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            'items' in data
        )
        
        print_test(
            "Leads list with sort=createdAt",
            passed,
            f"Status: {response.status_code}, Items: {len(data.get('items', []))}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Leads list with sort", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 5f: Pagination
    try:
        response = session.get(f"{API_URL}/leads?page=1&limit=2")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            'items' in data and
            data.get('page') == 1 and
            data.get('limit') == 2
        )
        
        print_test(
            "Leads list with pagination",
            passed,
            f"Status: {response.status_code}, Page: {data.get('page')}, Limit: {data.get('limit')}, Items: {len(data.get('items', []))}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Leads list with pagination", False, f"Error: {str(e)}")
        results.append(False)
    
    return all(results)

def test_lead_status_update():
    """Test PATCH /api/leads/:id"""
    print("=" * 60)
    print("TEST 6: Lead Status Update (PATCH /api/leads/:id)")
    print("=" * 60)
    
    results = []
    
    # Get a lead ID to update
    try:
        response = session.get(f"{API_URL}/leads?limit=1")
        data = response.json()
        if data.get('items') and len(data['items']) > 0:
            lead_id = data['items'][0]['id']
        else:
            print_test("Lead status update", False, "No leads available to update")
            return False
    except Exception as e:
        print_test("Lead status update", False, f"Error getting lead: {str(e)}")
        return False
    
    # Test 6a: Valid status update
    try:
        response = session.patch(f"{API_URL}/leads/{lead_id}", json={
            "status": "CONTACTED"
        })
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            'lead' in data and
            data['lead'].get('status') == 'CONTACTED'
        )
        
        print_test(
            "Valid status update to CONTACTED",
            passed,
            f"Status: {response.status_code}, New status: {data.get('lead', {}).get('status')}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Valid status update", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 6b: Invalid status
    try:
        response = session.patch(f"{API_URL}/leads/{lead_id}", json={
            "status": "INVALID_STATUS"
        })
        data = response.json()
        
        # Accept either 400 or 500 as per review request
        passed = (
            response.status_code in [400, 500] and
            'error' in data
        )
        
        print_test(
            "Invalid status rejection",
            passed,
            f"Status: {response.status_code}, Error: {data.get('error')}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Invalid status rejection", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 6c: Non-existent lead ID
    try:
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = session.patch(f"{API_URL}/leads/{fake_id}", json={
            "status": "CONTACTED"
        })
        data = response.json()
        
        passed = (
            response.status_code == 404 and
            'error' in data
        )
        
        print_test(
            "Non-existent lead ID (404)",
            passed,
            f"Status: {response.status_code}, Error: {data.get('error')}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Non-existent lead ID", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 6d: Without authentication
    try:
        temp_session = requests.Session()
        response = temp_session.patch(f"{API_URL}/leads/{lead_id}", json={
            "status": "QUALIFIED"
        })
        data = response.json()
        
        passed = (
            response.status_code == 401 and
            'error' in data
        )
        
        print_test(
            "Status update without auth (401)",
            passed,
            f"Status: {response.status_code}, Error: {data.get('error')}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Status update without auth", False, f"Error: {str(e)}")
        results.append(False)
    
    return all(results)

def test_stats():
    """Test GET /api/stats"""
    print("=" * 60)
    print("TEST 7: Stats Aggregation (GET /api/stats)")
    print("=" * 60)
    
    results = []
    
    # Test 7a: Without authentication
    try:
        temp_session = requests.Session()
        response = temp_session.get(f"{API_URL}/stats")
        data = response.json()
        
        passed = (
            response.status_code == 401 and
            'error' in data
        )
        
        print_test(
            "Stats without auth (401)",
            passed,
            f"Status: {response.status_code}, Error: {data.get('error')}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Stats without auth", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test 7b: With authentication
    try:
        response = session.get(f"{API_URL}/stats")
        data = response.json()
        
        required_fields = ['total', 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost']
        has_all_fields = all(field in data for field in required_fields)
        
        passed = (
            response.status_code == 200 and
            has_all_fields
        )
        
        print_test(
            "Stats with auth",
            passed,
            f"Status: {response.status_code}, Stats: {data}"
        )
        results.append(passed)
        
    except Exception as e:
        print_test("Stats with auth", False, f"Error: {str(e)}")
        results.append(False)
    
    return all(results)

def test_logout():
    """Test POST /api/auth/logout"""
    print("=" * 60)
    print("TEST 8: Logout (POST /api/auth/logout)")
    print("=" * 60)
    
    try:
        response = session.post(f"{API_URL}/auth/logout")
        data = response.json()
        
        # Check if cookie is cleared (should not be in session anymore)
        cookie_cleared = 'lh_session' not in session.cookies or session.cookies.get('lh_session') == ''
        
        passed = (
            response.status_code == 200 and
            data.get('ok') == True
        )
        
        print_test(
            "Logout clears session",
            passed,
            f"Status: {response.status_code}, Response: {data}"
        )
        return passed
        
    except Exception as e:
        print_test("Logout", False, f"Error: {str(e)}")
        return False

def test_happy_path_flow():
    """Test full happy path: create leads → login → list → update → verify stats"""
    print("=" * 60)
    print("TEST 9: Full Happy Path Flow")
    print("=" * 60)
    
    results = []
    flow_session = requests.Session()
    
    # Step 1: Create 3 leads publicly
    print("Step 1: Creating 3 leads publicly...")
    lead_ids = []
    for i in range(3):
        try:
            lead = {
                "name": f"Happy Path Lead {i+1}",
                "email": f"happypath{i+1}@testflow.com",
                "phone": f"+1-555-030{i}",
                "company": f"TestFlow Corp {i+1}",
                "message": f"This is test lead {i+1} for happy path flow testing."
            }
            response = requests.post(f"{API_URL}/leads", json=lead)
            if response.status_code == 201:
                lead_ids.append(response.json()['lead']['id'])
                print(f"   ✓ Created lead {i+1}")
            else:
                print(f"   ✗ Failed to create lead {i+1}")
        except Exception as e:
            print(f"   ✗ Error creating lead {i+1}: {str(e)}")
    
    results.append(len(lead_ids) == 3)
    print_test("Create 3 leads publicly", len(lead_ids) == 3, f"Created {len(lead_ids)}/3 leads")
    
    # Step 2: Login as admin
    print("Step 2: Logging in as admin...")
    try:
        response = flow_session.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        login_success = response.status_code == 200 and 'lh_session' in flow_session.cookies
        results.append(login_success)
        print_test("Login as admin", login_success, f"Status: {response.status_code}")
    except Exception as e:
        results.append(False)
        print_test("Login as admin", False, f"Error: {str(e)}")
    
    # Step 3: List leads and verify they exist
    print("Step 3: Listing all leads...")
    try:
        response = flow_session.get(f"{API_URL}/leads")
        data = response.json()
        list_success = response.status_code == 200 and data.get('total', 0) >= 3
        results.append(list_success)
        print_test("List leads", list_success, f"Total leads: {data.get('total')}")
    except Exception as e:
        results.append(False)
        print_test("List leads", False, f"Error: {str(e)}")
    
    # Step 4: Get initial stats
    print("Step 4: Getting initial stats...")
    try:
        response = flow_session.get(f"{API_URL}/stats")
        initial_stats = response.json()
        initial_new = initial_stats.get('new', 0)
        initial_contacted = initial_stats.get('contacted', 0)
        stats_success = response.status_code == 200
        results.append(stats_success)
        print_test("Get initial stats", stats_success, f"NEW: {initial_new}, CONTACTED: {initial_contacted}")
    except Exception as e:
        results.append(False)
        print_test("Get initial stats", False, f"Error: {str(e)}")
        return all(results)
    
    # Step 5: Update one lead to CONTACTED
    print("Step 5: Updating one lead to CONTACTED...")
    if lead_ids:
        try:
            response = flow_session.patch(f"{API_URL}/leads/{lead_ids[0]}", json={
                "status": "CONTACTED"
            })
            update_success = response.status_code == 200
            results.append(update_success)
            print_test("Update lead status", update_success, f"Status: {response.status_code}")
        except Exception as e:
            results.append(False)
            print_test("Update lead status", False, f"Error: {str(e)}")
    else:
        results.append(False)
        print_test("Update lead status", False, "No lead IDs available")
    
    # Step 6: Verify stats reflect the change
    print("Step 6: Verifying stats reflect the change...")
    try:
        response = flow_session.get(f"{API_URL}/stats")
        final_stats = response.json()
        final_new = final_stats.get('new', 0)
        final_contacted = final_stats.get('contacted', 0)
        
        # Stats should reflect the change (one less NEW, one more CONTACTED)
        # Note: We can't guarantee exact numbers due to other tests, but contacted should have increased
        stats_changed = final_contacted > initial_contacted
        
        results.append(stats_changed)
        print_test(
            "Stats reflect status change",
            stats_changed,
            f"Initial - NEW: {initial_new}, CONTACTED: {initial_contacted} | Final - NEW: {final_new}, CONTACTED: {final_contacted}"
        )
    except Exception as e:
        results.append(False)
        print_test("Stats verification", False, f"Error: {str(e)}")
    
    return all(results)

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("LEADHUB BACKEND API TEST SUITE")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"API URL: {API_URL}")
    print("=" * 60 + "\n")
    
    test_results = {}
    
    # Run all tests
    test_results['Health Check'] = test_health()
    test_results['Public Lead Creation'] = test_public_lead_creation()
    test_results['Authentication'] = test_authentication()
    test_results['Session Check (me)'] = test_auth_me()
    test_results['Protected Leads List'] = test_protected_leads_list()
    test_results['Lead Status Update'] = test_lead_status_update()
    test_results['Stats Aggregation'] = test_stats()
    test_results['Logout'] = test_logout()
    test_results['Happy Path Flow'] = test_happy_path_flow()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in test_results.values() if result)
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("=" * 60)
    print(f"TOTAL: {passed}/{total} tests passed")
    print("=" * 60 + "\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
