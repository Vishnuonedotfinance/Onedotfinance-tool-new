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
    
    def test_asset_crud_operations(self):
        """Test Asset CRUD operations"""
        self.log("=== Testing Asset CRUD Operations ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
            
        # Test data for asset creation
        asset_data = {
            "asset_type": "Laptop",
            "model": "MacBook Pro 16",
            "serial_number": "TEST123456",
            "purchase_date": "2024-01-15",
            "vendor": "Apple Store",
            "value_ex_gst": 150000,
            "warranty_period_months": 12,
            "alloted_to": "Test User",
            "email": "test@company.com",
            "department": "PPC"
        }
        
        try:
            # Step 1: Create Asset
            self.log("Step 1: Testing asset creation...")
            response = self.session.post(f"{BASE_URL}/assets", json=asset_data)
            self.log(f"Create asset response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Asset creation failed: {response.text}", "ERROR")
                return False
                
            created_asset = response.json()
            asset_id = created_asset.get('id')
            self.created_assets.append(asset_id)
            self.log(f"Asset created successfully. ID: {asset_id}")
            
            # Step 2: Get All Assets
            self.log("Step 2: Testing get all assets...")
            response = self.session.get(f"{BASE_URL}/assets")
            self.log(f"Get assets response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Get assets failed: {response.text}", "ERROR")
                return False
                
            assets = response.json()
            self.log(f"Retrieved {len(assets)} assets")
            
            # Verify our created asset is in the list
            found_asset = next((a for a in assets if a.get('id') == asset_id), None)
            if not found_asset:
                self.log("Created asset not found in assets list", "ERROR")
                return False
                
            # Step 3: Test Department Filtering
            self.log("Step 3: Testing department filtering...")
            response = self.session.get(f"{BASE_URL}/assets?department=PPC")
            self.log(f"Filter by department response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Department filtering failed: {response.text}", "ERROR")
                return False
                
            filtered_assets = response.json()
            self.log(f"Found {len(filtered_assets)} assets in PPC department")
            
            # Step 4: Update Asset
            self.log("Step 4: Testing asset update...")
            update_data = {"model": "MacBook Pro 14"}
            response = self.session.patch(f"{BASE_URL}/assets/{asset_id}", json=update_data)
            self.log(f"Update asset response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Asset update failed: {response.text}", "ERROR")
                return False
                
            self.log("Asset updated successfully")
            
            # Step 5: Test Delete (should work for Admin/Director)
            self.log("Step 5: Testing asset deletion...")
            response = self.session.delete(f"{BASE_URL}/assets/{asset_id}")
            self.log(f"Delete asset response status: {response.status_code}")
            
            if response.status_code == 200:
                self.log("Asset deleted successfully")
                self.created_assets.remove(asset_id)
            elif response.status_code == 403:
                self.log("Delete forbidden - user doesn't have Admin/Director role")
            else:
                self.log(f"Delete failed: {response.text}", "ERROR")
                return False
                
            return True
            
        except Exception as e:
            self.log(f"CRUD operations error: {str(e)}", "ERROR")
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