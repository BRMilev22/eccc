#!/bin/bash

# API Testing Script for EcoTracker
# Make sure the API server is running before executing this script

API_BASE="http://192.168.0.110:3000/api"
echo "🧪 Testing EcoTracker API at $API_BASE"
echo "=================================================="

# Test 1: Health Check
echo "1. 🏥 Health Check..."
curl -s -X GET "$API_BASE/reports/debug" | jq '.'
echo -e "\n"

# Test 2: Register User
echo "2. 📝 Register new user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser_'$(date +%s)'",
    "email": "test'$(date +%s)'@example.com", 
    "password": "password123"
  }')
echo $REGISTER_RESPONSE | jq '.'

# Extract token from registration response
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token // empty')
echo "Token: $TOKEN"
echo -e "\n"

# Test 3: Login
echo "3. 🔐 Login test (admin)..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')
echo $LOGIN_RESPONSE | jq '.'

# Extract admin token
ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // empty')
echo "Admin Token: $ADMIN_TOKEN"
echo -e "\n"

# Test 4: Get all reports
echo "4. 📊 Get all reports..."
curl -s -X GET "$API_BASE/reports" | jq '. | length' | xargs echo "Number of reports:"
echo -e "\n"

# Test 5: Create guest report
echo "5. 👤 Create guest report..."
GUEST_REPORT=$(curl -s -X POST "$API_BASE/reports" \
  -H "Content-Type: application/json" \
  -d '{
    "photoUrl": "https://via.placeholder.com/300x200/FF0000/FFFFFF?text=TEST",
    "latitude": 42.6977,
    "longitude": 23.3219,
    "description": "Test guest report from script",
    "trashType": "PLASTIC",
    "severityLevel": "MEDIUM"
  }')
echo $GUEST_REPORT | jq '.'
GUEST_REPORT_ID=$(echo $GUEST_REPORT | jq -r '.id // empty')
echo -e "\n"

# Test 6: Create authenticated report
if [ ! -z "$TOKEN" ]; then
  echo "6. 🔑 Create authenticated report..."
  AUTH_REPORT=$(curl -s -X POST "$API_BASE/reports" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "photoUrl": "https://via.placeholder.com/300x200/00FF00/FFFFFF?text=AUTH",
      "latitude": 42.7000,
      "longitude": 23.3300,
      "description": "Test authenticated report from script",
      "trashType": "HAZARDOUS",
      "severityLevel": "HIGH"
    }')
  echo $AUTH_REPORT | jq '.'
  AUTH_REPORT_ID=$(echo $AUTH_REPORT | jq -r '.id // empty')
  echo -e "\n"
fi

# Test 7: Update report status (admin)
if [ ! -z "$ADMIN_TOKEN" ] && [ ! -z "$GUEST_REPORT_ID" ]; then
  echo "7. ⚙️ Update report status (admin)..."
  curl -s -X PATCH "$API_BASE/reports/$GUEST_REPORT_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
      "status": "IN_PROGRESS",
      "description": "Updated by admin via script"
    }' | jq '.'
  echo -e "\n"
fi

# Test 8: Get specific report
if [ ! -z "$GUEST_REPORT_ID" ]; then
  echo "8. 🔍 Get specific report..."
  curl -s -X GET "$API_BASE/reports/$GUEST_REPORT_ID" | jq '.'
  echo -e "\n"
fi

# Test 9: Test image upload
echo "9. 📸 Test image upload..."
# Create a test image file
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test-image.png

# Upload the image
UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/upload" -F "image=@test-image.png")
echo $UPLOAD_RESPONSE | jq '.'

# Clean up test image
rm -f test-image.png
echo -e "\n"

echo "=================================================="
echo "✅ API Testing Complete!"
echo "=================================================="
