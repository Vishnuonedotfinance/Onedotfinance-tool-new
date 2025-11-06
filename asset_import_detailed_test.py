#!/usr/bin/env python3
"""
Detailed Asset Import Testing - Try to reproduce the "2 rows had errors" issue
"""

import requests
import json
import sys
from datetime import datetime
import pandas as pd
from io import BytesIO

# Configuration
BASE_URL = "https://onefinance.preview.emergentagent.com/api"
TEST_EMAIL = "vishnu@onedotfinance.com"
TEST_PASSWORD = "12345678"
ORG_ID = "org_cd4324ad"

class DetailedAssetImportTester:
    def __init__(self):
        self.token = None
        self.user_info = None
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def authenticate(self):
        """Authenticate with the provided credentials"""
        self.log("=== AUTHENTICATION ===")
        
        try:
            # Step 1: Login
            login_data = {
                "org_id": ORG_ID,
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            if response.status_code != 200:
                self.log(f"Login failed: {response.text}", "ERROR")
                return False
                
            login_result = response.json()
            otp = login_result.get('otp')
            
            # Step 2: Verify OTP
            otp_data = {
                "email": TEST_EMAIL,
                "otp": otp
            }
            
            response = self.session.post(f"{BASE_URL}/auth/verify-otp", json=otp_data)
            if response.status_code != 200:
                self.log(f"OTP verification failed: {response.text}", "ERROR")
                return False
                
            otp_result = response.json()
            self.token = otp_result.get('token')
            self.user_info = otp_result.get('user')
            
            self.log(f"Authentication successful. User: {self.user_info.get('name')} ({self.user_info.get('role')})")
            
            # Set authorization header
            self.session.headers.update({'Authorization': f'Bearer {self.token}'})
            
            return True
            
        except Exception as e:
            self.log(f"Authentication error: {str(e)}", "ERROR")
            return False
    
    def check_existing_assets(self):
        """Check existing assets in the system"""
        self.log("=== CHECKING EXISTING ASSETS ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/assets")
            self.log(f"Get assets response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Get assets failed: {response.text}", "ERROR")
                return False
            
            assets = response.json()
            self.log(f"Found {len(assets)} total assets in system")
            
            # Filter by org_id
            org_assets = [a for a in assets if a.get('org_id') == ORG_ID]
            self.log(f"Found {len(org_assets)} assets for org {ORG_ID}")
            
            # Show some sample assets
            for i, asset in enumerate(org_assets[:3]):
                self.log(f"Asset {i+1}: {asset.get('asset_type')} - {asset.get('model')} (ID: {asset.get('id')})")
            
            return True
            
        except Exception as e:
            self.log(f"Check existing assets error: {str(e)}", "ERROR")
            return False
    
    def create_test_file_with_errors(self):
        """Create a test Excel file with intentional errors to trigger validation"""
        self.log("=== CREATING TEST FILE WITH POTENTIAL ERRORS ===")
        
        try:
            # Create a DataFrame with some problematic data
            test_data = [
                # Valid row
                {
                    'asset_type': 'Laptop',
                    'model': 'Dell XPS 13',
                    'serial_number': 'SN001',
                    'purchase_date': '2024-01-15',
                    'vendor': 'Dell Store',
                    'value_ex_gst': 80000,
                    'warranty_period_months': 12,
                    'alloted_to': 'John Doe',
                    'email': 'john.doe@company.com',
                    'department': 'PPC'
                },
                # Row with invalid email
                {
                    'asset_type': 'Monitor',
                    'model': 'LG 24inch',
                    'serial_number': 'SN002',
                    'purchase_date': '2024-02-01',
                    'vendor': 'LG Store',
                    'value_ex_gst': 15000,
                    'warranty_period_months': 24,
                    'alloted_to': 'Jane Smith',
                    'email': 'invalid-email-format',  # Invalid email
                    'department': 'SEO'
                },
                # Row with invalid department
                {
                    'asset_type': 'Keyboard',
                    'model': 'Logitech MX',
                    'serial_number': 'SN003',
                    'purchase_date': '2024-03-10',
                    'vendor': 'Amazon',
                    'value_ex_gst': 8500,
                    'warranty_period_months': 12,
                    'alloted_to': 'Bob Wilson',
                    'email': 'bob.wilson@company.com',
                    'department': 'InvalidDept'  # Invalid department
                },
                # Row with missing required field
                {
                    'asset_type': 'Mouse',
                    'model': 'Logitech MX Master',
                    'serial_number': 'SN004',
                    'purchase_date': '2024-04-05',
                    'vendor': 'Amazon',
                    'value_ex_gst': 5000,
                    'warranty_period_months': 12,
                    'alloted_to': '',  # Missing required field
                    'email': 'test@company.com',
                    'department': 'Content'
                },
                # Row with invalid date format
                {
                    'asset_type': 'Headphones',
                    'model': 'Sony WH-1000XM4',
                    'serial_number': 'SN005',
                    'purchase_date': 'invalid-date',  # Invalid date
                    'vendor': 'Sony Store',
                    'value_ex_gst': 25000,
                    'warranty_period_months': 12,
                    'alloted_to': 'Alice Brown',
                    'email': 'alice.brown@company.com',
                    'department': 'Backlink'
                }
            ]
            
            df = pd.DataFrame(test_data)
            
            # Save to Excel file
            test_file_path = "/tmp/test_assets_with_errors.xlsx"
            df.to_excel(test_file_path, index=False)
            
            self.log(f"Created test file with {len(test_data)} rows at {test_file_path}")
            self.log("Test file contains intentional errors:")
            self.log("- Row 2: Invalid email format")
            self.log("- Row 3: Invalid department")
            self.log("- Row 4: Missing required field (alloted_to)")
            self.log("- Row 5: Invalid date format")
            
            return test_file_path
            
        except Exception as e:
            self.log(f"Create test file error: {str(e)}", "ERROR")
            return None
    
    def test_import_with_errors(self, file_path):
        """Test import with the error-prone file"""
        self.log("=== TESTING IMPORT WITH ERROR-PRONE FILE ===")
        
        try:
            with open(file_path, 'rb') as f:
                files = {'file': ('test_assets_with_errors.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = self.session.post(f"{BASE_URL}/assets/import", files=files)
            
            self.log(f"Import response status: {response.status_code}")
            
            try:
                response_json = response.json()
                self.log("=== FULL JSON RESPONSE ===")
                print(json.dumps(response_json, indent=2))
                
                # Extract key information
                imported_count = response_json.get('imported', 0)
                errors = response_json.get('errors', [])
                message = response_json.get('message', '')
                
                self.log(f"Response message: {message}")
                self.log(f"Imported count: {imported_count}")
                self.log(f"Error count: {len(errors) if errors else 0}")
                
                # If response contains "errors" field, print EVERY SINGLE error message
                if errors:
                    self.log("=== EXACT ERROR MESSAGES ===")
                    for i, error in enumerate(errors, 1):
                        self.log(f"Error {i}: {error}")
                        print(f"ERROR {i}: {error}")
                    
                    self.log("=== COMPLETE ERROR ARRAY ===")
                    print("ERRORS:", errors)
                    
                    # Analyze error patterns
                    self.log("=== ERROR ANALYSIS ===")
                    for error in errors:
                        if "Row" in error:
                            self.log(f"Row-specific error: {error}")
                        elif "email" in error.lower():
                            self.log(f"Email validation error: {error}")
                        elif "department" in error.lower():
                            self.log(f"Department validation error: {error}")
                        elif "date" in error.lower():
                            self.log(f"Date validation error: {error}")
                        else:
                            self.log(f"Other error: {error}")
                else:
                    self.log("No errors found in response")
                
                return True
                
            except json.JSONDecodeError:
                self.log("Response is not valid JSON")
                self.log(f"Raw response: {response.text}")
                return False
            
        except Exception as e:
            self.log(f"Import test error: {str(e)}", "ERROR")
            return False
    
    def test_original_sample_again(self):
        """Test the original sample file again to confirm it works"""
        self.log("=== TESTING ORIGINAL SAMPLE FILE AGAIN ===")
        
        try:
            # Download sample
            response = self.session.get(f"{BASE_URL}/assets/sample")
            if response.status_code != 200:
                self.log(f"Sample download failed: {response.text}", "ERROR")
                return False
            
            sample_file_path = "/tmp/original_sample.xlsx"
            with open(sample_file_path, 'wb') as f:
                f.write(response.content)
            
            # Import sample
            with open(sample_file_path, 'rb') as f:
                files = {'file': ('original_sample.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = self.session.post(f"{BASE_URL}/assets/import", files=files)
            
            self.log(f"Original sample import response status: {response.status_code}")
            
            if response.status_code == 200:
                response_json = response.json()
                imported_count = response_json.get('imported', 0)
                errors = response_json.get('errors', [])
                
                self.log(f"Original sample - Imported: {imported_count}, Errors: {len(errors) if errors else 0}")
                
                if errors:
                    self.log("Original sample has errors:")
                    for error in errors:
                        self.log(f"  - {error}")
            
            # Clean up
            import os
            if os.path.exists(sample_file_path):
                os.remove(sample_file_path)
            
            return True
            
        except Exception as e:
            self.log(f"Original sample test error: {str(e)}", "ERROR")
            return False
    
    def run_detailed_tests(self):
        """Run all detailed tests"""
        self.log("Starting Detailed Asset Import Tests")
        
        # Authenticate
        if not self.authenticate():
            return False
        
        # Check existing assets
        self.check_existing_assets()
        
        # Test original sample again
        self.test_original_sample_again()
        
        # Create and test file with errors
        test_file_path = self.create_test_file_with_errors()
        if test_file_path:
            self.test_import_with_errors(test_file_path)
            
            # Clean up
            try:
                import os
                if os.path.exists(test_file_path):
                    os.remove(test_file_path)
            except:
                pass
        
        return True

def main():
    """Main function"""
    tester = DetailedAssetImportTester()
    
    try:
        tester.run_detailed_tests()
        print("\n=== DETAILED TESTS COMPLETED ===")
        
    except KeyboardInterrupt:
        print("\nTests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()