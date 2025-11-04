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
BASE_URL = "https://finmgmt-tool.preview.emergentagent.com/api"
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
    
    def test_sample_template_download(self):
        """Test sample Excel template download"""
        self.log("=== Testing Sample Template Download ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        try:
            response = self.session.get(f"{BASE_URL}/assets/sample")
            self.log(f"Sample template response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Sample template download failed: {response.text}", "ERROR")
                return False
                
            # Check if response is Excel file
            content_type = response.headers.get('content-type', '')
            if 'spreadsheet' not in content_type and 'excel' not in content_type:
                self.log(f"Unexpected content type: {content_type}", "ERROR")
                return False
                
            content_length = len(response.content)
            self.log(f"Sample template downloaded successfully. Size: {content_length} bytes")
            
            # Check Content-Disposition header
            disposition = response.headers.get('content-disposition', '')
            if 'asset_sample.xlsx' not in disposition:
                self.log(f"Unexpected filename in disposition: {disposition}", "WARNING")
                
            return True
            
        except Exception as e:
            self.log(f"Sample template download error: {str(e)}", "ERROR")
            return False
    
    def test_bulk_export(self):
        """Test bulk export functionality"""
        self.log("=== Testing Bulk Export ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        # First create a few assets for export
        self.log("Creating test assets for export...")
        test_assets = [
            {
                "asset_type": "Laptop",
                "model": "Dell XPS 13",
                "serial_number": "EXPORT001",
                "purchase_date": "2024-01-01",
                "vendor": "Dell Store",
                "value_ex_gst": 80000,
                "warranty_period_months": 12,
                "alloted_to": "Export Test User 1",
                "email": "export1@company.com",
                "department": "SEO"
            },
            {
                "asset_type": "Monitor",
                "model": "LG 27inch",
                "serial_number": "EXPORT002",
                "purchase_date": "2024-02-01",
                "vendor": "LG Store",
                "value_ex_gst": 15000,
                "warranty_period_months": 24,
                "alloted_to": "Export Test User 2",
                "email": "export2@company.com",
                "department": "Content"
            }
        ]
        
        try:
            # Create test assets
            for asset_data in test_assets:
                response = self.session.post(f"{BASE_URL}/assets", json=asset_data)
                if response.status_code == 200:
                    asset_id = response.json().get('id')
                    self.created_assets.append(asset_id)
                    self.log(f"Created test asset: {asset_id}")
                    
            # Test export
            self.log("Testing bulk export...")
            response = self.session.get(f"{BASE_URL}/assets/export")
            self.log(f"Export response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Export failed: {response.text}", "ERROR")
                return False
                
            # Check if response is Excel file
            content_type = response.headers.get('content-type', '')
            if 'spreadsheet' not in content_type and 'excel' not in content_type:
                self.log(f"Unexpected content type: {content_type}", "ERROR")
                return False
                
            content_length = len(response.content)
            self.log(f"Export completed successfully. Size: {content_length} bytes")
            
            # Check Content-Disposition header
            disposition = response.headers.get('content-disposition', '')
            if 'assets_export.xlsx' not in disposition:
                self.log(f"Unexpected filename in disposition: {disposition}", "WARNING")
                
            return True
            
        except Exception as e:
            self.log(f"Bulk export error: {str(e)}", "ERROR")
            return False
    
    def test_bulk_import(self):
        """Test bulk import functionality (limited test with curl)"""
        self.log("=== Testing Bulk Import ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        self.log("Note: Bulk import requires multipart/form-data which is complex to test with requests")
        self.log("This would require creating an actual Excel file and uploading it")
        self.log("Manual testing recommended for this endpoint: POST /api/assets/import")
        
        # Test that the endpoint exists and requires authentication
        try:
            # Try without file (should fail with 422 or 400)
            response = self.session.post(f"{BASE_URL}/assets/import")
            self.log(f"Import endpoint response status: {response.status_code}")
            
            if response.status_code == 401:
                self.log("Import endpoint requires authentication (good)", "ERROR")
                return False
            elif response.status_code in [400, 422]:
                self.log("Import endpoint exists and validates input (good)")
                return True
            else:
                self.log(f"Unexpected response: {response.text}", "WARNING")
                return True
                
        except Exception as e:
            self.log(f"Bulk import test error: {str(e)}", "ERROR")
            return False
    
    def test_unauthorized_access(self):
        """Test that endpoints require authentication"""
        self.log("=== Testing Unauthorized Access ===")
        
        # Create session without token
        unauth_session = requests.Session()
        
        endpoints_to_test = [
            "/assets",
            "/assets/export", 
            "/assets/sample"
        ]
        
        try:
            for endpoint in endpoints_to_test:
                response = unauth_session.get(f"{BASE_URL}{endpoint}")
                self.log(f"Unauthorized access to {endpoint}: {response.status_code}")
                
                if response.status_code not in [401, 403]:
                    self.log(f"Security issue: {endpoint} accessible without auth", "ERROR")
                    return False
                    
            self.log("All endpoints properly require authentication")
            return True
            
        except Exception as e:
            self.log(f"Unauthorized access test error: {str(e)}", "ERROR")
            return False
    
    def cleanup(self):
        """Clean up created test assets"""
        self.log("=== Cleaning Up Test Data ===")
        
        if not self.token or not self.created_assets:
            self.log("No cleanup needed")
            return
            
        for asset_id in self.created_assets[:]:
            try:
                response = self.session.delete(f"{BASE_URL}/assets/{asset_id}")
                if response.status_code == 200:
                    self.log(f"Cleaned up asset: {asset_id}")
                    self.created_assets.remove(asset_id)
                elif response.status_code == 403:
                    self.log(f"Cannot delete asset {asset_id} - insufficient permissions")
                else:
                    self.log(f"Failed to cleanup asset {asset_id}: {response.status_code}")
            except Exception as e:
                self.log(f"Cleanup error for {asset_id}: {str(e)}", "ERROR")
    
    def run_all_tests(self):
        """Run all tests and return summary"""
        self.log("Starting Asset Tracker Backend API Tests")
        self.log(f"Base URL: {BASE_URL}")
        self.log(f"Test User: {TEST_EMAIL}")
        
        test_results = {}
        
        # Test authentication
        test_results['authentication'] = self.test_authentication()
        
        if test_results['authentication']:
            # Test CRUD operations
            test_results['crud_operations'] = self.test_asset_crud_operations()
            
            # Test sample template
            test_results['sample_template'] = self.test_sample_template_download()
            
            # Test bulk export
            test_results['bulk_export'] = self.test_bulk_export()
            
            # Test bulk import
            test_results['bulk_import'] = self.test_bulk_import()
            
            # Test unauthorized access
            test_results['unauthorized_access'] = self.test_unauthorized_access()
            
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
    tester = AssetTrackerTester()
    
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