#!/bin/bash

# Polymarket API Endpoints Test Script
# Run this to test all endpoints and generate a report in the reports/ directory

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:5173}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT="reports/endpoint-test-${TIMESTAMP}.md"
TEST_USER="0xdD4ac24f2895a7aeA20bCF9CCDb4A7795200F153"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure reports directory exists
mkdir -p reports

# Initialize report
echo "# Polymarket API Endpoints - Test Report" > "$OUTPUT"
echo "" >> "$OUTPUT"
echo "**Generated**: $(date)" >> "$OUTPUT"
echo "**Base URL**: $BASE_URL" >> "$OUTPUT"
echo "**Test User**: $TEST_USER" >> "$OUTPUT"
echo "" >> "$OUTPUT"

total=0
passed=0
failed=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expect="${3:-200}"

    total=$((total + 1))

    http_code=$(curl -s -o /tmp/response.json -w "%{http_code}" "$BASE_URL$url")

    if [ "$http_code" = "$expect" ]; then
        passed=$((passed + 1))
        echo -e "${GREEN}✅ $name${NC} (HTTP $http_code)"
        echo "## ✅ $name" >> "$OUTPUT"
        echo "" >> "$OUTPUT"
        echo "**Endpoint**: \`GET $url\`  " >> "$OUTPUT"
        echo "**Status**: $http_code ✓" >> "$OUTPUT"

        # Add detailed response summary
        if [ "$http_code" = "200" ]; then
            summary=$(python3 << 'PY'
import json
import sys
try:
    with open('/tmp/response.json') as f:
        d = json.load(f)

    output = []

    if isinstance(d, list):
        output.append(f"**Count**: {len(d)} items")
        if len(d) > 0:
            # Show details of first item
            first = d[0]
            if 'id' in first:
                output.append(f"**First ID**: {first['id']}")
            if 'ticker' in first:
                output.append(f"**First Ticker**: {first['ticker']}")
            if 'slug' in first:
                output.append(f"**First Slug**: {first['slug']}")
            if 'label' in first:
                output.append(f"**First Label**: {first['label']}")
            # Check for TagRelationship objects
            if 'tagID' in first and 'relatedTagID' in first:
                output.append(f"**First Tag ID**: {first.get('tagID')}")
                output.append(f"**First Related Tag ID**: {first.get('relatedTagID')}")
                if 'rank' in first:
                    output.append(f"**First Rank**: {first.get('rank')}")

    elif isinstance(d, dict):
        # For search results
        if 'events' in d:
            output.append(f"**Events**: {len(d['events'])} items")
            if len(d['events']) > 0 and 'id' in d['events'][0]:
                output.append(f"**First Event ID**: {d['events'][0]['id']}")

        if 'tags' in d:
            output.append(f"**Tags**: {len(d['tags'])} items")

        if 'profiles' in d:
            output.append(f"**Profiles**: {len(d['profiles'])} items")

        if 'pagination' in d:
            p = d['pagination']
            output.append(f"**Has More**: {p.get('hasMore', False)}")
            if 'totalResults' in p:
                output.append(f"**Total Results**: {p['totalResults']}")

        # For single item responses
        if 'id' in d and 'events' not in d:
            output.append(f"**ID**: {d.get('id')}")

        if 'ticker' in d:
            output.append(f"**Ticker**: {d.get('ticker')}")

        if 'slug' in d:
            output.append(f"**Slug**: {d.get('slug')}")

        if 'title' in d:
            title = d.get('title', '')
            if len(title) > 60:
                title = title[:60] + "..."
            output.append(f"**Title**: {title}")

        if 'label' in d:
            output.append(f"**Label**: {d.get('label')}")

        if 'markets' in d and isinstance(d['markets'], list):
            output.append(f"**Markets**: {len(d['markets'])} items")

        if 'tags' in d and isinstance(d['tags'], list) and 'events' not in d:
            output.append(f"**Tags**: {len(d['tags'])} items")

    if output:
        print("  ")
        for line in output:
            print(line + "  ")
except Exception as e:
    pass
PY
)
            echo "$summary" >> "$OUTPUT"
        fi
    else
        failed=$((failed + 1))
        echo -e "${RED}❌ $name${NC} (Expected: $expect, Got: $http_code)"
        echo "## ❌ $name" >> "$OUTPUT"
        echo "" >> "$OUTPUT"
        echo "**Endpoint**: \`GET $url\`  " >> "$OUTPUT"
        echo "**Expected**: $expect  " >> "$OUTPUT"
        echo "**Actual**: $http_code ✗" >> "$OUTPUT"

        # Add error response if available
        if [ -s /tmp/response.json ]; then
            echo "" >> "$OUTPUT"
            echo "<details>" >> "$OUTPUT"
            echo "<summary>Error Response</summary>" >> "$OUTPUT"
            echo "" >> "$OUTPUT"
            echo '```json' >> "$OUTPUT"
            cat /tmp/response.json | python3 -m json.tool 2>/dev/null >> "$OUTPUT" || cat /tmp/response.json >> "$OUTPUT"
            echo '```' >> "$OUTPUT"
            echo "</details>" >> "$OUTPUT"
        fi
    fi

    echo "" >> "$OUTPUT"
}

echo -e "${YELLOW}Starting Polymarket API endpoint tests...${NC}"
echo ""
echo "---" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Markets API
echo -e "${YELLOW}Testing Markets API...${NC}"
echo "# Markets API" >> "$OUTPUT"
echo "" >> "$OUTPUT"
test_endpoint "List Markets" "/api/markets?limit=3"
test_endpoint "List Markets with Pagination" "/api/markets?limit=2&offset=1"
test_endpoint "List Active Markets" "/api/markets?active=true&limit=3"

# Extract market IDs for later use
MARKET_ID=$(python3 << 'PY'
import json
try:
    with open('/tmp/response.json') as f:
        data = json.load(f)
    if isinstance(data, list) and len(data) > 0:
        print(data[0].get('id', ''))
except: pass
PY
)

# Test market tags endpoint if we have a market ID
if [ -n "$MARKET_ID" ]; then
    test_endpoint "Get Market Tags" "/api/markets/$MARKET_ID/tags"
fi

# Events API - Get event data first
echo -e "\n${YELLOW}Testing Events API...${NC}"
echo "# Events API" >> "$OUTPUT"
echo "" >> "$OUTPUT"
test_endpoint "List Events" "/api/events?limit=3"

# Extract event ID and slug from the list
EVENT_DATA=$(python3 << 'PY'
import json
try:
    with open('/tmp/response.json') as f:
        data = json.load(f)
    if isinstance(data, list) and len(data) > 0:
        event = data[0]
        print(f"{event.get('id', '')},{event.get('slug', '')}")
except: pass
PY
)

EVENT_ID=$(echo "$EVENT_DATA" | cut -d',' -f1)
EVENT_SLUG=$(echo "$EVENT_DATA" | cut -d',' -f2)

# Test event endpoints with dynamic data
if [ -n "$EVENT_ID" ]; then
    test_endpoint "Get Event by ID" "/api/events/$EVENT_ID"
    test_endpoint "Get Event Tags" "/api/events/$EVENT_ID/tags"
else
    echo -e "${RED}⚠ Skipping Get Event by ID - no event ID found${NC}"
    echo -e "${RED}⚠ Skipping Get Event Tags - no event ID found${NC}"
fi

if [ -n "$EVENT_SLUG" ]; then
    test_endpoint "Get Event by Slug" "/api/events/slug/$EVENT_SLUG"
else
    echo -e "${RED}⚠ Skipping Get Event by Slug - no slug found${NC}"
fi

# Series API
echo -e "\n${YELLOW}Testing Series API...${NC}"
echo "# Series API" >> "$OUTPUT"
echo "" >> "$OUTPUT"
test_endpoint "List Series" "/api/series?limit=3"

# Extract series ID
SERIES_ID=$(python3 << 'PY'
import json
try:
    with open('/tmp/response.json') as f:
        data = json.load(f)
    if isinstance(data, list) and len(data) > 0:
        print(data[0].get('id', ''))
except: pass
PY
)

if [ -n "$SERIES_ID" ]; then
    test_endpoint "Get Series by ID" "/api/series/$SERIES_ID"
else
    echo -e "${RED}⚠ Skipping Get Series by ID - no series ID found${NC}"
fi

# Tags API
echo -e "\n${YELLOW}Testing Tags API...${NC}"
echo "# Tags API" >> "$OUTPUT"
echo "" >> "$OUTPUT"
test_endpoint "List Tags" "/api/tags?limit=5"

# Extract tag ID and slug
TAG_DATA=$(python3 << 'PY'
import json
try:
    with open('/tmp/response.json') as f:
        data = json.load(f)
    if isinstance(data, list) and len(data) > 0:
        tag = data[0]
        print(f"{tag.get('id', '')},{tag.get('slug', '')}")
except: pass
PY
)

TAG_ID=$(echo "$TAG_DATA" | cut -d',' -f1)
TAG_SLUG=$(echo "$TAG_DATA" | cut -d',' -f2)

# Test tag endpoints
if [ -n "$TAG_ID" ]; then
    test_endpoint "Get Tag by ID" "/api/tags/$TAG_ID"
else
    echo -e "${RED}⚠ Skipping Get Tag by ID - no tag ID found${NC}"
fi

if [ -n "$TAG_SLUG" ]; then
    test_endpoint "Get Tag by Slug" "/api/tags/slug/$TAG_SLUG"
else
    echo -e "${RED}⚠ Skipping Get Tag by Slug - no slug found${NC}"
fi

# Test tag relationship endpoints
if [ -n "$TAG_ID" ]; then
    test_endpoint "Get Tag Relationships by ID" "/api/tags/$TAG_ID/relationships"
    test_endpoint "Get Related Tags by ID" "/api/tags/$TAG_ID/related"
else
    echo -e "${RED}⚠ Skipping tag relationship endpoints - no tag ID found${NC}"
fi

if [ -n "$TAG_SLUG" ]; then
    test_endpoint "Get Tag Relationships by Slug" "/api/tags/slug/$TAG_SLUG/relationships"
    test_endpoint "Get Related Tags by Slug" "/api/tags/slug/$TAG_SLUG/related"
else
    echo -e "${RED}⚠ Skipping tag relationship slug endpoints - no slug found${NC}"
fi

# Comments API - Use event ID from earlier
echo -e "\n${YELLOW}Testing Comments API...${NC}"
echo "# Comments API" >> "$OUTPUT"
echo "" >> "$OUTPUT"
if [ -n "$EVENT_ID" ]; then
    test_endpoint "List Comments by Event" "/api/comments?parent_entity_type=Event&parent_entity_id=$EVENT_ID&limit=3"
else
    echo -e "${RED}⚠ Skipping List Comments by Event - no event ID found${NC}"
fi

test_endpoint "List Comments by User" "/api/comments/user/$TEST_USER"

# Users API - Use test address
echo -e "\n${YELLOW}Testing Users API...${NC}"
echo "# Users API" >> "$OUTPUT"
echo "" >> "$OUTPUT"
test_endpoint "User Positions" "/api/users/positions?user=$TEST_USER"
test_endpoint "User Activity" "/api/users/activity?user=$TEST_USER"
test_endpoint "User Trades" "/api/users/trades?user=$TEST_USER"

# Search API
echo -e "\n${YELLOW}Testing Search API...${NC}"
echo "# Search API" >> "$OUTPUT"
echo "" >> "$OUTPUT"
test_endpoint "Search - Simple Query" "/api/search?q=bitcoin"
test_endpoint "Search - With Pagination" "/api/search?q=trump&page=0"
test_endpoint "Search - With Tags" "/api/search?q=election&search_tags=true&search_profiles=true"
test_endpoint "Search - Missing Query (Expected Fail)" "/api/search" "400"
test_endpoint "Search - Empty Query (Expected Fail)" "/api/search?q=" "400"

# Validation Tests
echo -e "\n${YELLOW}Testing Validation...${NC}"
echo "# Validation Tests" >> "$OUTPUT"
echo "" >> "$OUTPUT"
test_endpoint "Invalid Limit Parameter" "/api/markets?limit=abc" "400"
test_endpoint "Invalid Boolean Parameter" "/api/markets?active=maybe" "400"
test_endpoint "Invalid Event ID" "/api/events/999999999" "404"
test_endpoint "Invalid Event ID (Tags)" "/api/events/999999999/tags" "404"
test_endpoint "Invalid Series ID" "/api/series/999999999" "404"

# Summary
echo "---" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "## Summary" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "- **Total Tests**: $total" >> "$OUTPUT"
echo "- **Passed**: ✅ $passed" >> "$OUTPUT"
echo "- **Failed**: ❌ $failed" >> "$OUTPUT"
echo "- **Success Rate**: $(echo "scale=1; $passed * 100 / $total" | bc)%" >> "$OUTPUT"

# Terminal summary
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Total Tests:  $total"
echo -e "Passed:       ${GREEN}$passed${NC}"
echo -e "Failed:       ${RED}$failed${NC}"
echo -e "Success Rate: $(echo "scale=1; $passed * 100 / $total" | bc)%"
echo ""
echo -e "${GREEN}Report saved to: $OUTPUT${NC}"
echo ""

# Exit with error if any tests failed
if [ "$failed" -gt 0 ]; then
    exit 1
fi
