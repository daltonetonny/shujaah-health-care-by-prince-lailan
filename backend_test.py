import requests
import sys
import json
from datetime import datetime

class ShujaHealthAPITester:
    def __init__(self, base_url="https://5db6e729-620f-4fb3-908b-43644a15a575.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_chat_endpoint(self, message, user_id="test_user"):
        """Test chat endpoint with various messages"""
        return self.run_test(
            f"Chat - '{message[:30]}...'",
            "POST",
            "chat",
            200,
            data={"message": message, "user_id": user_id}
        )

    def test_chat_history(self, user_id="test_user"):
        """Test chat history endpoint"""
        return self.run_test(
            "Chat History",
            "GET",
            f"chat/history/{user_id}",
            200
        )

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test POST status
        success1, response1 = self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": "test_client"}
        )
        
        # Test GET status
        success2, response2 = self.run_test(
            "Get Status Checks",
            "GET",
            "status",
            200
        )
        
        return success1 and success2

    def test_user_creation(self):
        """Test user creation endpoint"""
        return self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data={"email": f"test_{datetime.now().strftime('%H%M%S')}@example.com", "name": "Test User"}
        )

def main():
    print("🏥 Starting Shujaa Health Care API Tests")
    print("=" * 50)
    
    # Setup
    tester = ShujaHealthAPITester()
    
    # Test basic endpoints
    print("\n📋 Testing Basic Endpoints...")
    tester.test_health_check()
    tester.test_root_endpoint()
    
    # Test status endpoints
    print("\n📊 Testing Status Endpoints...")
    tester.test_status_endpoints()
    
    # Test user creation
    print("\n👤 Testing User Management...")
    tester.test_user_creation()
    
    # Test chat functionality with various health scenarios
    print("\n💬 Testing Chat Functionality...")
    
    # Mental health scenarios
    tester.test_chat_endpoint("I feel anxious and worried about everything")
    tester.test_chat_endpoint("I'm feeling depressed and hopeless")
    tester.test_chat_endpoint("I'm having panic attacks")
    
    # Basic health queries
    tester.test_chat_endpoint("I have a severe headache")
    tester.test_chat_endpoint("I can't sleep at night")
    tester.test_chat_endpoint("I have a fever and feel hot")
    
    # Emergency scenarios
    tester.test_chat_endpoint("This is an emergency, I need help")
    tester.test_chat_endpoint("I'm having chest pain")
    
    # General health query
    tester.test_chat_endpoint("What should I do for stress management?")
    
    # Test chat history
    print("\n📜 Testing Chat History...")
    tester.test_chat_history("test_user")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! API is working correctly.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())