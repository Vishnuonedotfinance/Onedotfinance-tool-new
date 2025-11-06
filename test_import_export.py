#!/usr/bin/env python3
"""
Import/Export Testing Script - FOCUSED TEST
Tests ONLY the import/export functionality for Clients, Contractors, and Employees as requested by user
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BASE_URL = "https://onefinance.preview.emergentagent.com/api"
TEST_EMAIL = "vishnu@onedotfinance.com"
TEST_PASSWORD = "12345678"
ORG_ID = "org_cd4324ad"

class ImportExportTester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def authenticate(self):
        """Authenticate with the API"""
        self.log("=== AUTHENTICATION ===")
        
        try:
            # Step 1: Login
            login_data = {
                "org_id": ORG_ID,
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            self.log(f"Login response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"❌ Login failed: {response.text}", "ERROR")
                return False
                
            login_result = response.json()
            otp = login_result.get('otp')
            self.log(f"✅ Login successful. OTP: {otp}")
            
            # Step 2: Verify OTP
            otp_data = {
                "email": TEST_EMAIL,
                "otp": otp
            }
            
            response = self.session.post(f"{BASE_URL}/auth/verify-otp", json=otp_data)
            self.log(f"OTP verification response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"❌ OTP verification failed: {response.text}", "ERROR")
                return False
                
            otp_result = response.json()
            self.token = otp_result.get('token')
            
            if not self.token:
                self.log("❌ No token received", "ERROR")
                return False
                
            # Set authorization header
            self.session.headers.update({'Authorization': f'Bearer {self.token}'})
            self.log("✅ Authentication successful")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Authentication error: {str(e)}", "ERROR")
            return False
    
    def test_module_import_export(self, module_endpoint, module_name):
        """Test import/export for a single module"""
        self.log(f"\n🔍 TESTING {module_name.upper()} MODULE")
        self.log("="*50)
        
        sample_file_path = f"/tmp/{module_endpoint}_sample.xlsx"
        
        try:
            # Step A: Download Sample
            self.log(f"A. Download Sample: GET /api/{module_endpoint}/sample")
            response = self.session.get(f"{BASE_URL}/{module_endpoint}/sample")
            self.log(f"   Response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"   ❌ CRITICAL: Download sample failed: {response.text}", "ERROR")
                return False
                
            # Save the sample file
            with open(sample_file_path, 'wb') as f:
                f.write(response.content)
                
            file_size = len(response.content)
            self.log(f"   ✅ Sample downloaded successfully. Size: {file_size} bytes")
            
            if file_size < 1000:  # Excel files should be at least 1KB
                self.log(f"   ❌ CRITICAL: Sample file too small: {file_size} bytes", "ERROR")
                return False
            
            # Step B: Import EXACT Same File
            self.log(f"B. Import EXACT Same File: POST /api/{module_endpoint}/import")
            
            with open(sample_file_path, 'rb') as f:
                files = {'file': (f'{module_endpoint}_sample.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = self.session.post(f"{BASE_URL}/{module_endpoint}/import", files=files)
                
            self.log(f"   Response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"   ❌ CRITICAL: Import failed: {response.text}", "ERROR")
                return False
                
            import_result = response.json()
            
            # Step C: Report Results
            self.log(f"C. Report Results:")
            
            # Extract import statistics
            imported_count = 0
            error_count = 0
            error_messages = []
            
            # Handle different response formats
            if isinstance(import_result, dict):
                if 'imported' in import_result:
                    imported_count = import_result.get('imported', 0)
                elif 'message' in import_result:
                    # Parse message like "Import completed. Imported: 2 clients"
                    message = import_result.get('message', '')
                    if 'Imported:' in message:
                        try:
                            imported_count = int(message.split('Imported:')[1].split()[0])
                        except:
                            imported_count = 0
                    elif 'imported successfully' in message.lower():
                        # Try to extract number from "2 clients imported successfully"
                        try:
                            words = message.split()
                            for i, word in enumerate(words):
                                if word.isdigit():
                                    imported_count = int(word)
                                    break
                        except:
                            imported_count = 0
                
                if 'errors' in import_result:
                    errors = import_result.get('errors', [])
                    if errors:
                        error_count = len(errors)
                        error_messages = errors
                elif 'error_count' in import_result:
                    error_count = import_result.get('error_count', 0)
                    error_messages = import_result.get('error_messages', [])
            
            # Report the exact statistics as requested
            self.log(f"   📊 IMPORT STATISTICS:")
            self.log(f"      • Imported count: {imported_count}")
            self.log(f"      • Error count: {error_count}")
            
            if error_messages:
                self.log(f"      • Error messages:")
                for i, error in enumerate(error_messages, 1):
                    self.log(f"        {i}. {error}")
            else:
                self.log(f"      • Error messages: None")
            
            # Success criteria: Should import 2 sample rows with ZERO errors
            success = True
            if error_count > 0:
                self.log(f"   ❌ CRITICAL: {module_name} has {error_count} errors - NOT meeting success criteria", "ERROR")
                success = False
            
            if imported_count < 2:
                self.log(f"   ❌ CRITICAL: {module_name} imported only {imported_count} rows, expected at least 2", "ERROR")
                success = False
            
            if success:
                self.log(f"   ✅ SUCCESS: {module_name} imported {imported_count} rows with ZERO errors")
            
            # Clean up the sample file
            try:
                os.remove(sample_file_path)
            except:
                pass
            
            return success
            
        except Exception as e:
            self.log(f"   ❌ CRITICAL ERROR in {module_name} import/export: {str(e)}", "ERROR")
            return False
    
    def run_import_export_tests(self):
        """Run import/export tests for all modules"""
        self.log("🚀 STARTING IMPORT/EXPORT FUNCTIONALITY TESTS")
        self.log("="*60)
        self.log("Testing ALL Import/Export Functionality - Clients, Contractors, Employees")
        self.log("Authentication:")
        self.log(f"  • Org ID: {ORG_ID}")
        self.log(f"  • Email: {TEST_EMAIL}")
        self.log(f"  • Password: {TEST_PASSWORD}")
        self.log("="*60)
        
        # Authenticate first
        if not self.authenticate():
            self.log("❌ Authentication failed - cannot proceed with tests", "ERROR")
            return False
        
        # Test each module
        modules = [
            ('clients', 'CLIENTS'),
            ('contractors', 'CONTRACTORS'), 
            ('employees', 'EMPLOYEES')
        ]
        
        results = {}
        
        for module_endpoint, module_name in modules:
            result = self.test_module_import_export(module_endpoint, module_name)
            results[module_name] = result
        
        # Final Summary
        self.log("\n" + "="*60)
        self.log("📊 FINAL IMPORT/EXPORT TEST RESULTS")
        self.log("="*60)
        
        all_passed = True
        for module_name, result in results.items():
            status = "✅ SUCCESS" if result else "❌ FAILED"
            self.log(f"{module_name}: {status}")
            if not result:
                all_passed = False
        
        self.log("\n" + "="*60)
        if all_passed:
            self.log("🎉 ALL MODULES WORKING PERFECTLY!")
            self.log("✅ Each module successfully imported 2 sample rows with ZERO errors")
            self.log("✅ ALL modules must work perfectly - SUCCESS CRITERIA MET")
        else:
            failed_modules = [name for name, result in results.items() if not result]
            self.log(f"❌ FAILED MODULES: {', '.join(failed_modules)}")
            self.log("❌ Import/Export functionality has CRITICAL issues that need immediate attention")
        
        self.log("="*60)
        
        return all_passed

def main():
    """Main function"""
    tester = ImportExportTester()
    success = tester.run_import_export_tests()
    
    if success:
        print("\n✅ ALL IMPORT/EXPORT TESTS PASSED")
        sys.exit(0)
    else:
        print("\n❌ IMPORT/EXPORT TESTS FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()