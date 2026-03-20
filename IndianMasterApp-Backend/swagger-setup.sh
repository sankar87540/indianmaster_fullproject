#!/bin/bash
# Swagger Documentation Management Script
# This script helps manage Swagger documentation for the Indian Master API

set -e

PROJECT_DIR="/workspaces/Indian_Master.app/myapp"
DOCS_DIR="$PROJECT_DIR/docs"
MAIN_FILE="cmd/main.go"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Swagger Documentation Management Script               ║${NC}"
echo -e "${BLUE}║              Indian Master API - OpenAPI 2.0                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Function to generate Swagger documentation
generate_docs() {
    echo -e "${YELLOW}→ Generating Swagger documentation...${NC}"
    cd "$PROJECT_DIR"
    
    # Check if swag is installed
    if ! command -v swag &> /dev/null; then
        echo -e "${YELLOW}→ Installing swag CLI...${NC}"
        go install github.com/swaggo/swag/cmd/swag@latest
    fi
    
    # Generate docs
    swag init -g "$MAIN_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Swagger documentation generated successfully!${NC}"
        echo -e "${GREEN}✓ Generated files:${NC}"
        echo -e "${GREEN}  - docs/docs.go${NC}"
        echo -e "${GREEN}  - docs/swagger.json${NC}"
        echo -e "${GREEN}  - docs/swagger.yaml${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to generate Swagger documentation${NC}"
        return 1
    fi
}

# Function to build the application
build_app() {
    echo -e "${YELLOW}→ Building application...${NC}"
    cd "$PROJECT_DIR"
    
    go build -o bin/app cmd/main.go
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Application built successfully!${NC}"
        echo -e "${GREEN}✓ Binary: bin/app${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to build application${NC}"
        return 1
    fi
}

# Function to verify documentation
verify_docs() {
    echo -e "${YELLOW}→ Verifying generated documentation...${NC}"
    
    if [ ! -f "$DOCS_DIR/swagger.json" ]; then
        echo -e "${RED}✗ swagger.json not found${NC}"
        return 1
    fi
    
    # Check if valid JSON
    if ! python3 -m json.tool "$DOCS_DIR/swagger.json" > /dev/null 2>&1; then
        echo -e "${RED}✗ swagger.json is not valid JSON${NC}"
        return 1
    fi
    
    # Count endpoints
    ENDPOINT_COUNT=$(grep -c '"summary"' "$DOCS_DIR/swagger.json" || echo "0")
    
    if [ -f "$DOCS_DIR/docs.go" ]; then
        echo -e "${GREEN}✓ docs.go exists${NC}"
    fi
    
    if [ -f "$DOCS_DIR/swagger.json" ]; then
        echo -e "${GREEN}✓ swagger.json is valid ($(readsize "$DOCS_DIR/swagger.json"))${NC}"
    fi
    
    if [ -f "$DOCS_DIR/swagger.yaml" ]; then
        echo -e "${GREEN}✓ swagger.yaml exists ($(readsize "$DOCS_DIR/swagger.yaml"))${NC}"
    fi
    
    echo -e "${GREEN}✓ Total API endpoints documented: $ENDPOINT_COUNT${NC}"
    
    return 0
}

# Function to show file size
readsize() {
    if [ "$(uname)" = "Darwin" ]; then
        stat -f%z "$1" | awk '{printf "%.1f KB", $1/1024}'
    else
        stat -f%s "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null | awk '{printf "%.1f KB", $1/1024}'
    fi
}

# Function to display documentation info
show_info() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}SWAGGER DOCUMENTATION INFO${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
    
    echo -e "${YELLOW}Project Information:${NC}"
    echo "  Title: Indian Master API"
    echo "  Version: 1.0"
    echo "  API Base Path: /api/v1"
    echo "  Schemes: HTTP, HTTPS"
    echo ""
    
    echo -e "${YELLOW}Generated Files:${NC}"
    echo "  • docs/docs.go"
    echo "  • docs/swagger.json"
    echo "  • docs/swagger.yaml"
    echo ""
    
    echo -e "${YELLOW}Documentation Files:${NC}"
    echo "  • SWAGGER_SETUP.md (Complete setup guide)"
    echo "  • SWAGGER_QUICK_REFERENCE.md (Quick reference)"
    echo ""
    
    echo -e "${YELLOW}Accessing Swagger UI:${NC}"
    echo "  1. Start application: cd myapp && go run cmd/main.go"
    echo "  2. Open in browser: http://localhost:8080/swagger/index.html"
    echo ""
    
    echo -e "${YELLOW}Documented Endpoints:${NC}"
    echo "  Worker Endpoints (4):"
    echo "    • POST   /worker/profile"
    echo "    • GET    /worker/profile"
    echo "    • PUT    /worker/profile"
    echo "    • GET    /worker/profile/verification/{id}"
    echo ""
    echo "  Job Endpoints (4):"
    echo "    • POST   /hirer/jobs"
    echo "    • GET    /jobs/feed"
    echo "    • GET    /jobs/{id}"
    echo "    • PUT    /hirer/jobs/{id}"
    echo ""
    echo "  Application Endpoints (3):"
    echo "    • POST   /applications"
    echo "    • PUT    /admin/applications/{id}/status"
    echo "    • GET    /applications/my-applications"
    echo ""
    echo "  Chat Endpoints (3):"
    echo "    • POST   /chat/threads"
    echo "    • POST   /chat/threads/{id}/messages"
    echo "    • GET    /chat/threads/{id}/messages"
    echo ""
    echo "  Subscription Endpoints (3):"
    echo "    • POST   /subscriptions"
    echo "    • GET    /subscriptions/active"
    echo "    • GET    /subscriptions/contact-limit"
    echo ""
    echo "  Notification Endpoints (1):"
    echo "    • GET    /notifications"
    echo ""
    echo "  Admin Endpoints (2):"
    echo "    • POST   /admin/verification/approve"
    echo "    • POST   /admin/verification/reject"
    echo ""
    echo -e "${YELLOW}Total Endpoints: 20${NC}\n"
}

# Function to run all checks
run_all() {
    echo -e "\n${BLUE}Running complete Swagger setup...${NC}\n"
    
    generate_docs || exit 1
    echo ""
    
    verify_docs || exit 1
    echo ""
    
    build_app || exit 1
    echo ""
    
    show_info
    
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ✓ All Swagger setup checks passed!                  ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║  Next Step: Start the application and access Swagger UI:   ║${NC}"
    echo -e "${GREEN}║  cd myapp && go run cmd/main.go                             ║${NC}"
    echo -e "${GREEN}║  http://localhost:8080/swagger/index.html                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

# Parse command line arguments
case "${1:-all}" in
    generate)
        generate_docs
        ;;
    verify)
        verify_docs
        ;;
    build)
        build_app
        ;;
    info)
        show_info
        ;;
    all)
        run_all
        ;;
    *)
        echo "Usage: $0 {generate|verify|build|info|all}"
        echo ""
        echo "Commands:"
        echo "  generate  - Generate Swagger documentation from annotations"
        echo "  verify    - Verify generated documentation is valid"
        echo "  build     - Build the application binary"
        echo "  info      - Display Swagger documentation information"
        echo "  all       - Run all steps (default)"
        exit 1
        ;;
esac
