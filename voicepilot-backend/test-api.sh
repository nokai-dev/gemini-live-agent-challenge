#!/bin/bash

# VoicePilot Backend API Test Script

echo "🧪 Testing VoicePilot Backend API"
echo "================================="
echo ""

BASE_URL="http://localhost:8080"

# Test 1: Health check
echo "Test 1: Health Check"
curl -s "$BASE_URL/health" | jq .
echo ""

# Test 2: Root endpoint
echo "Test 2: Root Endpoint"
curl -s "$BASE_URL/" | jq .
echo ""

# Test 3: Demo endpoint - button blue
echo "Test 3: Demo Endpoint (button-blue)"
curl -s -X POST "$BASE_URL/api/analyze/demo" \
  -H "Content-Type: application/json" \
  -d '{"demoType": "button-blue"}' | jq .
echo ""

# Test 4: Demo endpoint - card padding
echo "Test 4: Demo Endpoint (card-padding)"
curl -s -X POST "$BASE_URL/api/analyze/demo" \
  -H "Content-Type: application/json" \
  -d '{"demoType": "card-padding"}' | jq .
echo ""

# Test 5: Demo endpoint - text bigger
echo "Test 5: Demo Endpoint (text-bigger)"
curl -s -X POST "$BASE_URL/api/analyze/demo" \
  -H "Content-Type: application/json" \
  -d '{"demoType": "text-bigger"}' | jq .
echo ""

# Test 6: Demo endpoint - grid layout
echo "Test 6: Demo Endpoint (grid-layout)"
curl -s -X POST "$BASE_URL/api/analyze/demo" \
  -H "Content-Type: application/json" \
  -d '{"demoType": "grid-layout"}' | jq .
echo ""

# Test 7: Full analyze endpoint (mock data)
echo "Test 7: Full Analyze Endpoint"
curl -s -X POST "$BASE_URL/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "screenshot": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "audio": "bW9jayBhdWRpbyBkYXRhIGZvciB0ZXN0aW5n",
    "selection": {
      "x": 100,
      "y": 200,
      "width": 150,
      "height": 50
    }
  }' | jq .
echo ""

echo "✅ All tests completed!"
