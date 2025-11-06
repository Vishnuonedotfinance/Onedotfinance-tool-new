#!/usr/bin/env python3
"""
Asset Import Testing Script - Focused test for user-reported issue
Tests the exact steps requested: Download sample, Import file, Capture exact error messages
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://onefinance.preview.emergentagent.com/api"
TEST_EMAIL = "vishnu@onedotfinance.com"
TEST_PASSWORD = "12345678"
ORG_ID = "org_cd4324ad"

class AssetImportTester:
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
            self.log("Step 1: Login...")
            login_data = {
                "org_id": ORG_ID,
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            self.log(f"Login response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Login failed: {response.text}", "ERROR")
                return False
                
            login_result = response.json()
            otp = login_result.get('otp')
            self.log(f"Login successful. OTP: {otp}")
            
            # Step 2: Verify OTP
            self.log("Step 2: OTP verification...")
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
            
            self.log(f"Authentication successful. User: {self.user_info.get('name')} ({self.user_info.get('role')})")
            
            # Set authorization header
            self.session.headers.update({'Authorization': f'Bearer {self.token}'})
            
            return True
            
        except Exception as e:
            self.log(f"Authentication error: {str(e)}", "ERROR")
            return False
    
    def test_asset_import_with_error_capture(self):
        """Test Asset Import with detailed error capture as requested"""
        self.log("=== ASSET IMPORT TEST WITH ERROR CAPTURE ===")
        
        if not self.token:
            self.log("No authentication token available", "ERROR")
            return False
        
        sample_file_path = "/tmp/asset_sample_new.xlsx"
        
        try:
            # Step 1: Download Fresh Sample (GET /api/assets/sample)
            self.log("Step 1: Download Fresh Sample - GET /api/assets/sample")
            response = self.session.get(f"{BASE_URL}/assets/sample")
            self.log(f"Sample download response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"Sample download failed: {response.text}", "ERROR")
                return False
            
            # Save to /tmp/asset_sample_new.xlsx as requested
            with open(sample_file_path, 'wb') as f:
                f.write(response.content)
            
            file_size = len(response.content)
            self.log(f"Sample file saved to {sample_file_path}. Size: {file_size} bytes")
            
            # Step 2: Import with Error Capture (POST /api/assets/import)
            self.log("Step 2: Import with Error Capture - POST /api/assets/import")
            
            with open(sample_file_path, 'rb') as f:
                files = {'file': ('asset_sample_new.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = self.session.post(f"{BASE_URL}/assets/import", files=files)
            
            self.log(f"Import response status: {response.status_code}")
            
            # Step 3: Check Response Structure and Capture EXACT errors
            self.log("Step 3: Check Response Structure and Error Messages")
            
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
                else:
                    self.log("No errors found in response")
                
                # Check if import was successful
                if response.status_code == 200:
                    if imported_count > 0:
                        self.log(f"Import successful: {imported_count} assets imported")
                        if errors:
                            self.log(f"Import completed with {len(errors)} errors")
                    else:
                        self.log("Import completed but no assets were imported")
                        if errors:
                            self.log("This may be due to the errors listed above")
                else:
                    self.log(f"Import failed with status {response.status_code}")
                
                return True
                
            except json.JSONDecodeError:
                self.log("Response is not valid JSON")
                self.log(f"Raw response: {response.text}")
                return False
            
        except Exception as e:
            self.log(f"Asset import test error: {str(e)}", "ERROR")
            return False
        finally:
            # Clean up the downloaded file
            try:
                import os
                if os.path.exists(sample_file_path):
                    os.remove(sample_file_path)
                    self.log(f"Cleaned up file: {sample_file_path}")
            except:
                pass
    
    def run_test(self):
        """Run the focused asset import test"""
        self.log("Starting Asset Import Error Capture Test")
        self.log(f"Base URL: {BASE_URL}")
        self.log(f"Test User: {TEST_EMAIL}")
        self.log(f"Org ID: {ORG_ID}")
        
        # Authenticate
        if not self.authenticate():
            self.log("Authentication failed - cannot proceed with tests", "ERROR")
            return False
        
        # Run the asset import test
        result = self.test_asset_import_with_error_capture()
        
        if result:
            self.log("Asset import test completed successfully")
        else:
            self.log("Asset import test failed", "ERROR")
        
        return result

def main():
    """Main function to run the focused test"""
    tester = AssetImportTester()
    
    try:
        success = tester.run_test()
        
        if success:
            print("\n=== TEST COMPLETED ===")
            print("Asset import test completed. Check the logs above for exact error messages.")
            sys.exit(0)
        else:
            print("\n=== TEST FAILED ===")
            print("Asset import test failed. Check the error logs above.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()