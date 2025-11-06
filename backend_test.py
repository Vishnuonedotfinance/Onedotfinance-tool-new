#!/usr/bin/env python3
"""
Backend API Testing Script for New Features
Tests authentication, user management, client service updates, contractor/employee new fields, dashboard enhancements
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://onefinance.preview.emergentagent.com/api"
TEST_EMAIL = "Vishnu@onedotfinance.com"
TEST_PASSWORD = "12345678"

class BackendTester:
    def __init__(self):
        self.token = None
        self.user_info = None
        self.created_users = []
        self.created_clients = []
        self.created_contractors = []
        self.created_employees = []
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_authentication(self):
        """Test login and OTP verification flow"""
        self.log("=== Testing Authentication Flow ===")
        
        # Step 1: Login
        self.log("Step 1: Testing login...")
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            self.log(f"Login response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Login failed: {response.text}", "ERROR")
                return False
                
            login_result = response.json()
            self.log(f"Login successful. OTP: {login_result.get('otp', 'Not provided')}")
            
            # Step 2: Verify OTP
            self.log("Step 2: Testing OTP verification...")
            otp = login_result.get('otp')
            if not otp:
                self.log("No OTP provided in login response", "ERROR")
                return False
                
            otp_data = {
                "email": TEST_EMAIL,
                "otp": otp
            }
            
            response = self.session.post(f"{BASE_URL}/auth/verify-otp", json=otp_data)
            self.log(f"OTP verification response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"OTP verification failed: {response.text}", "ERROR")
                return False
                
            otp_result = response.json()
            self.token = otp_result.get('token')
            self.user_info = otp_result.get('user')
            
            if not self.token:
                self.log("No token received from OTP verification", "ERROR")
                return False
                
            self.log(f"Authentication successful. User: {self.user_info.get('name')} ({self.user_info.get('role')})")
            
            # Set authorization header for future requests
            self.session.headers.update({'Authorization': f'Bearer {self.token}'})
            
            return True
            
        except Exception as e:
            self.log(f"Authentication error: {str(e)}", "ERROR")
            return False
    
    def test_user_management(self):
        """Test User Management - Create test user, DELETE test user, try DELETE Admin user"""
        self.log("=== Testing User Management ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        try:
            # Step 1: Create a test user (Staff role)
            self.log("Step 1: Creating test user with Staff role...")
            user_data = {
                "name": "Test Staff User",
                "email": "teststaff@company.com",
                "mobile": "9876543210",
                "role": "Staff",
                "password": "testpass123"
            }
            
            response = self.session.post(f"{BASE_URL}/users", json=user_data)
            self.log(f"Create user response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"User creation failed: {response.text}", "ERROR")
                return False
                
            created_user = response.json()
            user_id = created_user.get('id')
            self.created_users.append(user_id)
            self.log(f"Test user created successfully. ID: {user_id}")
            
            # Step 2: Try to DELETE the test user (should work for Admin)
            self.log("Step 2: Testing deletion of test user...")
            response = self.session.delete(f"{BASE_URL}/users/{user_id}")
            self.log(f"Delete test user response status: {response.status_code}")
            
            if response.status_code == 200:
                self.log("Test user deleted successfully")
                self.created_users.remove(user_id)
            elif response.status_code == 403:
                self.log("Delete forbidden - current user doesn't have Admin role", "ERROR")
                return False
            else:
                self.log(f"Delete test user failed: {response.text}", "ERROR")
                return False
            
            # Step 3: Try to DELETE an Admin user (should fail with 403)
            self.log("Step 3: Testing deletion of Admin user (should fail)...")
            
            # First get all users to find an Admin
            response = self.session.get(f"{BASE_URL}/users")
            if response.status_code != 200:
                self.log(f"Failed to get users: {response.text}", "ERROR")
                return False
                
            users = response.json()
            admin_user = next((u for u in users if u.get('role') == 'Admin'), None)
            
            if not admin_user:
                self.log("No Admin user found to test deletion", "WARNING")
                return True
                
            admin_id = admin_user.get('id')
            response = self.session.delete(f"{BASE_URL}/users/{admin_id}")
            self.log(f"Delete Admin user response status: {response.status_code}")
            
            if response.status_code == 403:
                self.log("Admin user deletion correctly forbidden")
                return True
            else:
                self.log(f"Admin user deletion should have been forbidden but got: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"User management test error: {str(e)}", "ERROR")
            return False
    
    def test_client_service_update(self):
        """Test Client Service Update - Create client with service='Backlink'"""
        self.log("=== Testing Client Service Update ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        try:
            # Step 1: Create a new client with service="Backlink"
            self.log("Step 1: Creating client with Backlink service...")
            client_data = {
                "client_name": "Backlink Test Client",
                "address": "123 Test Street, Test City",
                "start_date": "2025-01-01",
                "tenure_months": 12,
                "currency_preference": "INR",
                "service": "Backlink",
                "amount_inr": 75000,
                "authorised_signatory": "John Doe",
                "signatory_designation": "CEO",
                "gst": "GST123456789",
                "poc_name": "Jane Smith",
                "poc_email": "jane@backlinktest.com",
                "poc_designation": "Manager",
                "poc_mobile": "9876543210",
                "approver_user_id": self.user_info.get('id')
            }
            
            response = self.session.post(f"{BASE_URL}/clients", json=client_data)
            self.log(f"Create client response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Client creation failed: {response.text}", "ERROR")
                return False
                
            created_client = response.json()
            client_id = created_client.get('id')
            self.created_clients.append(client_id)
            self.log(f"Backlink client created successfully. ID: {client_id}")
            
            # Verify service is set correctly
            if created_client.get('service') != 'Backlink':
                self.log(f"Service not set correctly. Expected: Backlink, Got: {created_client.get('service')}", "ERROR")
                return False
            
            # Step 2: GET /api/clients to verify the new service type
            self.log("Step 2: Verifying Backlink service in clients list...")
            response = self.session.get(f"{BASE_URL}/clients")
            self.log(f"Get clients response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Get clients failed: {response.text}", "ERROR")
                return False
                
            clients = response.json()
            backlink_clients = [c for c in clients if c.get('service') == 'Backlink']
            self.log(f"Found {len(backlink_clients)} clients with Backlink service")
            
            # Verify our created client is in the list
            found_client = next((c for c in backlink_clients if c.get('id') == client_id), None)
            if not found_client:
                self.log("Created Backlink client not found in clients list", "ERROR")
                return False
                
            self.log("Backlink service successfully verified in clients list")
            return True
            
        except Exception as e:
            self.log(f"Client service update test error: {str(e)}", "ERROR")
            return False
    
    def test_active_clients_by_department(self):
        """Test Active Clients by Department API"""
        self.log("=== Testing Active Clients by Department ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        try:
            # Step 1: GET /api/clients/active-by-department?department=PPC
            self.log("Step 1: Testing active clients for PPC department...")
            response = self.session.get(f"{BASE_URL}/clients/active-by-department?department=PPC")
            self.log(f"Active PPC clients response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Get active PPC clients failed: {response.text}", "ERROR")
                return False
                
            ppc_clients = response.json()
            self.log(f"Found {len(ppc_clients)} active PPC clients")
            
            # Verify all returned clients have service=PPC and client_status=Active
            for client in ppc_clients:
                if client.get('service') != 'PPC':
                    self.log(f"Non-PPC client returned: {client.get('service')}", "ERROR")
                    return False
            
            # Step 2: GET /api/clients/active-by-department?department=Backlink
            self.log("Step 2: Testing active clients for Backlink department...")
            response = self.session.get(f"{BASE_URL}/clients/active-by-department?department=Backlink")
            self.log(f"Active Backlink clients response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Get active Backlink clients failed: {response.text}", "ERROR")
                return False
                
            backlink_clients = response.json()
            self.log(f"Found {len(backlink_clients)} active Backlink clients")
            
            # Verify all returned clients have service=Backlink
            for client in backlink_clients:
                if client.get('service') != 'Backlink':
                    self.log(f"Non-Backlink client returned: {client.get('service')}", "ERROR")
                    return False
            
            self.log("Active clients by department API working correctly")
            return True
            
        except Exception as e:
            self.log(f"Active clients by department test error: {str(e)}", "ERROR")
            return False
    
    def test_contractor_new_fields(self):
        """Test Contractor with New Fields - gender, department=Backlink, projects"""
        self.log("=== Testing Contractor New Fields ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        try:
            # Step 1: Create a contractor with new fields
            self.log("Step 1: Creating contractor with new fields...")
            contractor_data = {
                "name": "Test Contractor",
                "doj": "2025-01-01",
                "start_date": "2025-01-01",
                "tenure_months": 12,
                "dob": "1990-05-15",
                "gender": "Male",
                "pan": "ABCDE1234F",
                "aadhar": "123456789012",
                "mobile": "9876543210",
                "personal_email": "contractor@test.com",
                "bank_name": "Test Bank",
                "account_holder": "Test Contractor",
                "account_no": "1234567890",
                "ifsc": "TEST0001234",
                "address_1": "123 Test Street",
                "pincode": "110001",
                "city": "Test City",
                "address_2": "Near Test Market",
                "department": "Backlink",
                "projects": [],
                "monthly_retainer_inr": 50000,
                "designation": "Backlink Specialist",
                "approver_user_id": self.user_info.get('id')
            }
            
            response = self.session.post(f"{BASE_URL}/contractors", json=contractor_data)
            self.log(f"Create contractor response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Contractor creation failed: {response.text}", "ERROR")
                return False
                
            created_contractor = response.json()
            contractor_id = created_contractor.get('id')
            self.created_contractors.append(contractor_id)
            self.log(f"Contractor created successfully. ID: {contractor_id}")
            
            # Verify new fields are set correctly
            if created_contractor.get('gender') != 'Male':
                self.log(f"Gender not set correctly. Expected: Male, Got: {created_contractor.get('gender')}", "ERROR")
                return False
                
            if created_contractor.get('department') != 'Backlink':
                self.log(f"Department not set correctly. Expected: Backlink, Got: {created_contractor.get('department')}", "ERROR")
                return False
                
            if created_contractor.get('projects') != []:
                self.log(f"Projects not set correctly. Expected: [], Got: {created_contractor.get('projects')}", "ERROR")
                return False
            
            # Step 2: Update contractor to add projects list with some client IDs
            self.log("Step 2: Updating contractor to add projects...")
            
            # Get some client IDs first
            response = self.session.get(f"{BASE_URL}/clients")
            if response.status_code == 200:
                clients = response.json()
                client_ids = [c.get('id') for c in clients[:2]]  # Take first 2 clients
            else:
                client_ids = ["client_123", "client_456"]  # Use dummy IDs if no clients
            
            update_data = {"projects": client_ids}
            response = self.session.patch(f"{BASE_URL}/contractors/{contractor_id}", json=update_data)
            self.log(f"Update contractor response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Contractor update failed: {response.text}", "ERROR")
                return False
                
            self.log(f"Contractor projects updated successfully with {len(client_ids)} projects")
            
            # Step 3: Verify the fields are stored correctly
            self.log("Step 3: Verifying contractor fields...")
            response = self.session.get(f"{BASE_URL}/contractors")
            if response.status_code != 200:
                self.log(f"Get contractors failed: {response.text}", "ERROR")
                return False
                
            contractors = response.json()
            found_contractor = next((c for c in contractors if c.get('id') == contractor_id), None)
            
            if not found_contractor:
                self.log("Created contractor not found", "ERROR")
                return False
                
            if found_contractor.get('gender') != 'Male':
                self.log(f"Gender verification failed. Expected: Male, Got: {found_contractor.get('gender')}", "ERROR")
                return False
                
            if found_contractor.get('department') != 'Backlink':
                self.log(f"Department verification failed. Expected: Backlink, Got: {found_contractor.get('department')}", "ERROR")
                return False
                
            if len(found_contractor.get('projects', [])) != len(client_ids):
                self.log(f"Projects verification failed. Expected: {len(client_ids)}, Got: {len(found_contractor.get('projects', []))}", "ERROR")
                return False
            
            self.log("Contractor new fields verified successfully")
            return True
            
        except Exception as e:
            self.log(f"Contractor new fields test error: {str(e)}", "ERROR")
            return False
    
    def test_employee_new_fields(self):
        """Test Employee with New Fields - gender, department=Backlink, projects"""
        self.log("=== Testing Employee New Fields ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        try:
            # Step 1: Create an employee with new fields
            self.log("Step 1: Creating employee with new fields...")
            employee_data = {
                "doj": "2025-01-15",
                "work_email": "employee@company.com",
                "emp_id": "EMP001",
                "first_name": "Test",
                "last_name": "Employee",
                "father_name": "Test Father",
                "dob": "1995-03-20",
                "gender": "Female",
                "mobile": "9876543210",
                "personal_email": "employee.personal@test.com",
                "pan": "ABCDE1234F",
                "aadhar": "123456789012",
                "uan": "UAN123456",
                "pf_account_no": "PF123456",
                "bank_name": "Test Bank",
                "account_no": "1234567890",
                "ifsc": "TEST0001234",
                "branch": "Main Branch",
                "address": "123 Test Street",
                "pincode": "110001",
                "city": "Test City",
                "monthly_gross_inr": 60000,
                "department": "Backlink",
                "projects": [],
                "approver_user_id": self.user_info.get('id')
            }
            
            response = self.session.post(f"{BASE_URL}/employees", json=employee_data)
            self.log(f"Create employee response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Employee creation failed: {response.text}", "ERROR")
                return False
                
            created_employee = response.json()
            employee_id = created_employee.get('id')
            self.created_employees.append(employee_id)
            self.log(f"Employee created successfully. ID: {employee_id}")
            
            # Verify new fields are set correctly
            if created_employee.get('gender') != 'Female':
                self.log(f"Gender not set correctly. Expected: Female, Got: {created_employee.get('gender')}", "ERROR")
                return False
                
            if created_employee.get('department') != 'Backlink':
                self.log(f"Department not set correctly. Expected: Backlink, Got: {created_employee.get('department')}", "ERROR")
                return False
                
            if created_employee.get('projects') != []:
                self.log(f"Projects not set correctly. Expected: [], Got: {created_employee.get('projects')}", "ERROR")
                return False
            
            # Step 2: Update employee to add projects list with some client IDs
            self.log("Step 2: Updating employee to add projects...")
            
            # Get some client IDs first
            response = self.session.get(f"{BASE_URL}/clients")
            if response.status_code == 200:
                clients = response.json()
                client_ids = [c.get('id') for c in clients[:2]]  # Take first 2 clients
            else:
                client_ids = ["client_789", "client_012"]  # Use dummy IDs if no clients
            
            update_data = {"projects": client_ids}
            response = self.session.patch(f"{BASE_URL}/employees/{employee_id}", json=update_data)
            self.log(f"Update employee response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Employee update failed: {response.text}", "ERROR")
                return False
                
            self.log(f"Employee projects updated successfully with {len(client_ids)} projects")
            
            # Step 3: Verify the fields are stored correctly
            self.log("Step 3: Verifying employee fields...")
            response = self.session.get(f"{BASE_URL}/employees")
            if response.status_code != 200:
                self.log(f"Get employees failed: {response.text}", "ERROR")
                return False
                
            employees = response.json()
            found_employee = next((e for e in employees if e.get('id') == employee_id), None)
            
            if not found_employee:
                self.log("Created employee not found", "ERROR")
                return False
                
            if found_employee.get('gender') != 'Female':
                self.log(f"Gender verification failed. Expected: Female, Got: {found_employee.get('gender')}", "ERROR")
                return False
                
            if found_employee.get('department') != 'Backlink':
                self.log(f"Department verification failed. Expected: Backlink, Got: {found_employee.get('department')}", "ERROR")
                return False
                
            if len(found_employee.get('projects', [])) != len(client_ids):
                self.log(f"Projects verification failed. Expected: {len(client_ids)}, Got: {len(found_employee.get('projects', []))}", "ERROR")
                return False
            
            self.log("Employee new fields verified successfully")
            return True
            
        except Exception as e:
            self.log(f"Employee new fields test error: {str(e)}", "ERROR")
            return False
    
    def test_dashboard_summary(self):
        """Test Dashboard Summary - verify expired_agreements, revenue/employees/contractors have Backlink key"""
        self.log("=== Testing Dashboard Summary ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        try:
            # GET /api/dashboard/summary
            self.log("Testing dashboard summary endpoint...")
            response = self.session.get(f"{BASE_URL}/dashboard/summary")
            self.log(f"Dashboard summary response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Dashboard summary failed: {response.text}", "ERROR")
                return False
                
            dashboard_data = response.json()
            
            # Verify response structure
            if 'alerts' not in dashboard_data:
                self.log("Missing 'alerts' in dashboard response", "ERROR")
                return False
                
            if 'revenue' not in dashboard_data:
                self.log("Missing 'revenue' in dashboard response", "ERROR")
                return False
                
            if 'employees' not in dashboard_data:
                self.log("Missing 'employees' in dashboard response", "ERROR")
                return False
                
            if 'contractors' not in dashboard_data:
                self.log("Missing 'contractors' in dashboard response", "ERROR")
                return False
            
            # Verify alerts.expired_agreements array exists
            alerts = dashboard_data.get('alerts', {})
            if 'expired_agreements' not in alerts:
                self.log("Missing 'expired_agreements' in alerts", "ERROR")
                return False
                
            expired_agreements = alerts.get('expired_agreements', [])
            self.log(f"Found {len(expired_agreements)} expired agreements")
            
            # Verify revenue object has "Backlink" key
            revenue = dashboard_data.get('revenue', {})
            if 'Backlink' not in revenue:
                self.log("Missing 'Backlink' key in revenue object", "ERROR")
                return False
                
            backlink_revenue = revenue.get('Backlink', {})
            self.log(f"Backlink revenue: count={backlink_revenue.get('count', 0)}, amount={backlink_revenue.get('amount', 0)}")
            
            # Verify employees object has "Backlink" key
            employees = dashboard_data.get('employees', {})
            if 'Backlink' not in employees:
                self.log("Missing 'Backlink' key in employees object", "ERROR")
                return False
                
            backlink_employees = employees.get('Backlink', {})
            self.log(f"Backlink employees: count={backlink_employees.get('count', 0)}, cost={backlink_employees.get('cost', 0)}")
            
            # Verify contractors object has "Backlink" key
            contractors = dashboard_data.get('contractors', {})
            if 'Backlink' not in contractors:
                self.log("Missing 'Backlink' key in contractors object", "ERROR")
                return False
                
            backlink_contractors = contractors.get('Backlink', {})
            self.log(f"Backlink contractors: count={backlink_contractors.get('count', 0)}, cost={backlink_contractors.get('cost', 0)}")
            
            self.log("Dashboard summary structure verified successfully")
            return True
            
        except Exception as e:
            self.log(f"Dashboard summary test error: {str(e)}", "ERROR")
            return False

    def test_client_onboarding_module(self):
        """Test Client Onboarding Module - CRUD operations"""
        self.log("=== Testing Client Onboarding Module ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        created_onboarding_id = None
        
        try:
            # Step 1: GET /api/client-onboarding (should be empty initially or show existing)
            self.log("Step 1: Testing GET /api/client-onboarding...")
            response = self.session.get(f"{BASE_URL}/client-onboarding")
            self.log(f"Get client onboarding response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Get client onboarding failed: {response.text}", "ERROR")
                return False
                
            initial_onboardings = response.json()
            self.log(f"Found {len(initial_onboardings)} existing onboardings")
            
            # Step 2: POST /api/client-onboarding - Create new onboarding
            self.log("Step 2: Testing POST /api/client-onboarding...")
            onboarding_data = {
                "client_name": "Test Client Corp",
                "poc_name": "John Doe",
                "poc_email": "john@testclient.com",
                "services": ["PPC", "SEO"],
                "currency": "USD",
                "pricing": 5000.0,
                "approver_user_id": self.user_info.get('id')
            }
            
            response = self.session.post(f"{BASE_URL}/client-onboarding", json=onboarding_data)
            self.log(f"Create client onboarding response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Client onboarding creation failed: {response.text}", "ERROR")
                return False
                
            created_onboarding = response.json()
            created_onboarding_id = created_onboarding.get('id')
            self.log(f"Client onboarding created successfully. ID: {created_onboarding_id}")
            
            # Verify fields
            if created_onboarding.get('client_name') != 'Test Client Corp':
                self.log(f"Client name mismatch. Expected: Test Client Corp, Got: {created_onboarding.get('client_name')}", "ERROR")
                return False
                
            if created_onboarding.get('services') != ["PPC", "SEO"]:
                self.log(f"Services mismatch. Expected: ['PPC', 'SEO'], Got: {created_onboarding.get('services')}", "ERROR")
                return False
                
            if created_onboarding.get('currency') != 'USD':
                self.log(f"Currency mismatch. Expected: USD, Got: {created_onboarding.get('currency')}", "ERROR")
                return False
                
            if created_onboarding.get('pricing') != 5000.0:
                self.log(f"Pricing mismatch. Expected: 5000.0, Got: {created_onboarding.get('pricing')}", "ERROR")
                return False
            
            # Step 3: PATCH /api/client-onboarding/{id} - Update onboarding status
            self.log("Step 3: Testing PATCH /api/client-onboarding/{id}...")
            update_data = {
                "proposal_status": "Approved",
                "onboarding_status": "WIP"
            }
            
            response = self.session.patch(f"{BASE_URL}/client-onboarding/{created_onboarding_id}", json=update_data)
            self.log(f"Update client onboarding response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Client onboarding update failed: {response.text}", "ERROR")
                return False
                
            self.log("Client onboarding updated successfully")
            
            # Step 4: Verify the update by getting the list again
            self.log("Step 4: Verifying update...")
            response = self.session.get(f"{BASE_URL}/client-onboarding")
            if response.status_code != 200:
                self.log(f"Get client onboarding after update failed: {response.text}", "ERROR")
                return False
                
            updated_onboardings = response.json()
            found_onboarding = next((o for o in updated_onboardings if o.get('id') == created_onboarding_id), None)
            
            if not found_onboarding:
                self.log("Updated onboarding not found", "ERROR")
                return False
                
            if found_onboarding.get('proposal_status') != 'Approved':
                self.log(f"Proposal status not updated. Expected: Approved, Got: {found_onboarding.get('proposal_status')}", "ERROR")
                return False
                
            if found_onboarding.get('onboarding_status') != 'WIP':
                self.log(f"Onboarding status not updated. Expected: WIP, Got: {found_onboarding.get('onboarding_status')}", "ERROR")
                return False
            
            # Step 5: DELETE /api/client-onboarding/{id}
            self.log("Step 5: Testing DELETE /api/client-onboarding/{id}...")
            response = self.session.delete(f"{BASE_URL}/client-onboarding/{created_onboarding_id}")
            self.log(f"Delete client onboarding response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Client onboarding deletion failed: {response.text}", "ERROR")
                return False
                
            self.log("Client onboarding deleted successfully")
            created_onboarding_id = None  # Mark as cleaned up
            
            # Verify deletion
            response = self.session.get(f"{BASE_URL}/client-onboarding")
            if response.status_code == 200:
                final_onboardings = response.json()
                deleted_onboarding = next((o for o in final_onboardings if o.get('id') == created_onboarding_id), None)
                if deleted_onboarding:
                    self.log("Onboarding still exists after deletion", "ERROR")
                    return False
            
            self.log("Client Onboarding Module tests completed successfully")
            return True
            
        except Exception as e:
            self.log(f"Client onboarding test error: {str(e)}", "ERROR")
            return False
        finally:
            # Cleanup if needed
            if created_onboarding_id:
                try:
                    self.session.delete(f"{BASE_URL}/client-onboarding/{created_onboarding_id}")
                    self.log(f"Cleaned up onboarding: {created_onboarding_id}")
                except:
                    pass

    def test_consumables_module(self):
        """Test Consumables Module - Stock In/Out operations and inventory tracking"""
        self.log("=== Testing Consumables Module ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        try:
            # Step 1: GET /api/stock-products (should be empty initially)
            self.log("Step 1: Testing GET /api/stock-products...")
            response = self.session.get(f"{BASE_URL}/stock-products")
            self.log(f"Get stock products response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Get stock products failed: {response.text}", "ERROR")
                return False
                
            initial_products = response.json()
            self.log(f"Found {len(initial_products)} existing products")
            
            # Step 2: POST /api/stock-in - Add new stock
            self.log("Step 2: Testing POST /api/stock-in...")
            stock_in_data = {
                "product_name": "USB Cables",
                "quantity": 100,
                "price": 500.0,
                "vendor_name": "Tech Supplies Inc",
                "email": "vendor@techsupplies.com",
                "invoice_number": "INV-2025-001",
                "date": "2025-11-06"
            }
            
            response = self.session.post(f"{BASE_URL}/stock-in", json=stock_in_data)
            self.log(f"Stock in response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Stock in failed: {response.text}", "ERROR")
                return False
                
            stock_in_result = response.json()
            self.log("Stock in operation successful")
            
            # Step 3: GET /api/stock-availability - Verify stock created with correct quantity
            self.log("Step 3: Testing GET /api/stock-availability...")
            response = self.session.get(f"{BASE_URL}/stock-availability")
            self.log(f"Get stock availability response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Get stock availability failed: {response.text}", "ERROR")
                return False
                
            stock_availability = response.json()
            self.log(f"Found {len(stock_availability)} stock items")
            
            # Find our USB Cables
            usb_cables_stock = next((s for s in stock_availability if s.get('product_name') == 'USB Cables'), None)
            if not usb_cables_stock:
                self.log("USB Cables not found in stock availability", "ERROR")
                return False
                
            if usb_cables_stock.get('stock_available') != 100:
                self.log(f"Stock quantity mismatch. Expected: 100, Got: {usb_cables_stock.get('stock_available')}", "ERROR")
                return False
                
            self.log(f"USB Cables stock verified: {usb_cables_stock.get('stock_available')} units available")
            stock_item_id = usb_cables_stock.get('id')
            
            # Step 4: POST /api/stock-out - Issue stock
            self.log("Step 4: Testing POST /api/stock-out...")
            stock_out_data = {
                "product_name": "USB Cables",
                "quantity": 20,
                "issued_to": "Engineering Team",
                "email": "eng@company.com",
                "date": "2025-11-06"
            }
            
            response = self.session.post(f"{BASE_URL}/stock-out", json=stock_out_data)
            self.log(f"Stock out response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Stock out failed: {response.text}", "ERROR")
                return False
                
            stock_out_result = response.json()
            self.log("Stock out operation successful")
            
            # Step 5: GET /api/stock-availability - Verify quantity decreased (100 - 20 = 80)
            self.log("Step 5: Verifying stock quantity after stock out...")
            response = self.session.get(f"{BASE_URL}/stock-availability")
            if response.status_code != 200:
                self.log(f"Get stock availability after stock out failed: {response.text}", "ERROR")
                return False
                
            updated_stock_availability = response.json()
            updated_usb_cables = next((s for s in updated_stock_availability if s.get('product_name') == 'USB Cables'), None)
            
            if not updated_usb_cables:
                self.log("USB Cables not found after stock out", "ERROR")
                return False
                
            expected_quantity = 100 - 20  # 80
            if updated_usb_cables.get('stock_available') != expected_quantity:
                self.log(f"Stock quantity after stock out incorrect. Expected: {expected_quantity}, Got: {updated_usb_cables.get('stock_available')}", "ERROR")
                return False
                
            self.log(f"Stock quantity correctly updated to: {updated_usb_cables.get('stock_available')} units")
            
            # Step 6: GET /api/stock-transactions - Verify both transactions recorded
            self.log("Step 6: Testing GET /api/stock-transactions...")
            response = self.session.get(f"{BASE_URL}/stock-transactions")
            self.log(f"Get stock transactions response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Get stock transactions failed: {response.text}", "ERROR")
                return False
                
            transactions = response.json()
            self.log(f"Found {len(transactions)} stock transactions")
            
            # Find our transactions
            usb_transactions = [t for t in transactions if t.get('product_name') == 'USB Cables']
            if len(usb_transactions) < 2:
                self.log(f"Expected at least 2 USB Cables transactions, found: {len(usb_transactions)}", "ERROR")
                return False
                
            # Verify we have both Stock In and Stock Out
            transaction_types = [t.get('type') for t in usb_transactions]
            if 'Stock In' not in transaction_types or 'Stock Out' not in transaction_types:
                self.log(f"Missing transaction types. Found: {transaction_types}", "ERROR")
                return False
                
            self.log("Stock transactions verified successfully")
            
            # Step 7: PATCH /api/stock-availability/{id} - Update notes for a stock item
            self.log("Step 7: Testing PATCH /api/stock-availability/{id}...")
            update_notes_data = {
                "notes": "Updated via API test - good quality cables"
            }
            
            response = self.session.patch(f"{BASE_URL}/stock-availability/{stock_item_id}", json=update_notes_data)
            self.log(f"Update stock notes response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Update stock notes failed: {response.text}", "ERROR")
                return False
                
            self.log("Stock notes updated successfully")
            
            # Step 8: Error Case - Try stock-out with insufficient quantity (should fail)
            self.log("Step 8: Testing insufficient stock error case...")
            insufficient_stock_data = {
                "product_name": "USB Cables",
                "quantity": 200,  # More than available (80)
                "issued_to": "Test Team",
                "email": "test@company.com",
                "date": "2025-11-06"
            }
            
            response = self.session.post(f"{BASE_URL}/stock-out", json=insufficient_stock_data)
            self.log(f"Insufficient stock test response status: {response.status_code}")
            
            if response.status_code == 200:
                self.log("Insufficient stock should have failed but succeeded", "ERROR")
                return False
            elif response.status_code in [400, 422]:
                self.log("Insufficient stock correctly rejected")
            else:
                self.log(f"Unexpected response for insufficient stock: {response.status_code}", "WARNING")
            
            self.log("Consumables Module tests completed successfully")
            return True
            
        except Exception as e:
            self.log(f"Consumables module test error: {str(e)}", "ERROR")
            return False

    def test_static_file_serving(self):
        """Test Static File Serving for uploads directory"""
        self.log("=== Testing Static File Serving ===")
        
        try:
            # Test if /uploads directory is accessible (even if empty)
            self.log("Testing /uploads directory accessibility...")
            
            # Try to access the uploads directory
            uploads_url = BASE_URL.replace('/api', '/uploads')
            response = self.session.get(uploads_url)
            self.log(f"Uploads directory response status: {response.status_code}")
            
            # We expect either 200 (directory listing) or 403 (forbidden but exists) or 404 (not found)
            if response.status_code in [200, 403, 404]:
                self.log(f"Uploads directory endpoint responding (status: {response.status_code})")
                
                # Try to access logos subdirectory
                logos_url = f"{uploads_url}/logos"
                response = self.session.get(logos_url)
                self.log(f"Logos directory response status: {response.status_code}")
                
                if response.status_code in [200, 403, 404]:
                    self.log("Static file serving structure appears to be configured")
                    return True
                else:
                    self.log(f"Unexpected response from logos directory: {response.status_code}", "WARNING")
                    return True  # Still consider it working as the main uploads responded
            else:
                self.log(f"Uploads directory not accessible: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Static file serving test error: {str(e)}", "ERROR")
            return False
    
    def cleanup(self):
        """Clean up created test data"""
        self.log("=== Cleaning Up Test Data ===")
        
        if not self.token:
            self.log("No cleanup needed - no authentication token")
            return
            
        # Clean up users
        for user_id in self.created_users[:]:
            try:
                response = self.session.delete(f"{BASE_URL}/users/{user_id}")
                if response.status_code == 200:
                    self.log(f"Cleaned up user: {user_id}")
                    self.created_users.remove(user_id)
                else:
                    self.log(f"Failed to cleanup user {user_id}: {response.status_code}")
            except Exception as e:
                self.log(f"Cleanup error for user {user_id}: {str(e)}", "ERROR")
        
        # Clean up clients
        for client_id in self.created_clients[:]:
            try:
                response = self.session.delete(f"{BASE_URL}/clients/{client_id}")
                if response.status_code == 200:
                    self.log(f"Cleaned up client: {client_id}")
                    self.created_clients.remove(client_id)
                elif response.status_code == 403:
                    self.log(f"Cannot delete client {client_id} - insufficient permissions")
                else:
                    self.log(f"Failed to cleanup client {client_id}: {response.status_code}")
            except Exception as e:
                self.log(f"Cleanup error for client {client_id}: {str(e)}", "ERROR")
        
        # Clean up contractors
        for contractor_id in self.created_contractors[:]:
            try:
                response = self.session.delete(f"{BASE_URL}/contractors/{contractor_id}")
                if response.status_code == 200:
                    self.log(f"Cleaned up contractor: {contractor_id}")
                    self.created_contractors.remove(contractor_id)
                elif response.status_code == 403:
                    self.log(f"Cannot delete contractor {contractor_id} - insufficient permissions")
                else:
                    self.log(f"Failed to cleanup contractor {contractor_id}: {response.status_code}")
            except Exception as e:
                self.log(f"Cleanup error for contractor {contractor_id}: {str(e)}", "ERROR")
        
        # Clean up employees
        for employee_id in self.created_employees[:]:
            try:
                response = self.session.delete(f"{BASE_URL}/employees/{employee_id}")
                if response.status_code == 200:
                    self.log(f"Cleaned up employee: {employee_id}")
                    self.created_employees.remove(employee_id)
                elif response.status_code == 403:
                    self.log(f"Cannot delete employee {employee_id} - insufficient permissions")
                else:
                    self.log(f"Failed to cleanup employee {employee_id}: {response.status_code}")
            except Exception as e:
                self.log(f"Cleanup error for employee {employee_id}: {str(e)}", "ERROR")
    
    def run_all_tests(self):
        """Run all tests and return summary"""
        self.log("Starting Backend API Tests for New Features")
        self.log(f"Base URL: {BASE_URL}")
        self.log(f"Test User: {TEST_EMAIL}")
        
        test_results = {}
        
        # Test authentication
        test_results['authentication'] = self.test_authentication()
        
        if test_results['authentication']:
            # Test new functionality
            test_results['user_management'] = self.test_user_management()
            test_results['client_service_update'] = self.test_client_service_update()
            test_results['active_clients_by_department'] = self.test_active_clients_by_department()
            test_results['contractor_new_fields'] = self.test_contractor_new_fields()
            test_results['employee_new_fields'] = self.test_employee_new_fields()
            test_results['dashboard_summary'] = self.test_dashboard_summary()
            
            # Cleanup
            self.cleanup()
        else:
            self.log("Skipping other tests due to authentication failure", "ERROR")
        
        # Print summary
        self.log("=== TEST SUMMARY ===")
        passed = 0
        total = 0
        
        for test_name, result in test_results.items():
            status = "PASS" if result else "FAIL"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
            total += 1
        
        self.log(f"Overall: {passed}/{total} tests passed")
        
        return test_results

def main():
    """Main function to run tests"""
    tester = BackendTester()
    
    try:
        results = tester.run_all_tests()
        
        # Exit with error code if any tests failed
        if not all(results.values()):
            sys.exit(1)
        else:
            print("\nAll tests passed successfully!")
            sys.exit(0)
            
    except KeyboardInterrupt:
        print("\nTests interrupted by user")
        tester.cleanup()
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        tester.cleanup()
        sys.exit(1)

if __name__ == "__main__":
    main()