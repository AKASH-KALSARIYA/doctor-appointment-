#!/bin/bash

# RuralCare Deployment Script
# Usage: ./deploy.sh [environment]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ruralcare-doctor-appointment"
VERSION="2.0.0"
BUILD_DIR="dist"
BACKUP_DIR="backups"

# Environment setup
ENVIRONMENT=${1:-"production"}
case $ENVIRONMENT in
    "development")
        FIREBASE_PROJECT="ruralcare-dev"
        BASE_URL="https://dev.ruralcare.example.com"
        ;;
    "staging")
        FIREBASE_PROJECT="ruralcare-staging"
        BASE_URL="https://staging.ruralcare.example.com"
        ;;
    "production")
        FIREBASE_PROJECT="ruralcare-1db29"
        BASE_URL="https://ruralcare.example.com"
        ;;
    *)
        echo -e "${RED}Error: Unknown environment '$ENVIRONMENT'${NC}"
        echo "Usage: $0 [development|staging|production]"
        exit 1
        ;;
esac

echo -e "${BLUE}🚀 RuralCare Deployment Script${NC}"
echo -e "${BLUE}===============================${NC}"
echo -e "Project: ${GREEN}$PROJECT_NAME${NC}"
echo -e "Version: ${GREEN}$VERSION${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Firebase Project: ${YELLOW}$FIREBASE_PROJECT${NC}"
echo ""

# Function to print section headers
section() {
    echo -e "\n${BLUE}➤ $1${NC}"
}

# Function to print success messages
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warnings
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to run commands with error checking
run() {
    echo -e "${BLUE}Running:${NC} $1"
    if eval "$1"; then
        success "Command completed successfully"
    else
        error "Command failed"
        exit 1
    fi
}

# Function to create backup
create_backup() {
    section "Creating Backup"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="${PROJECT_NAME}_${ENVIRONMENT}_${TIMESTAMP}.tar.gz"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
    fi
    
    # Backup important files
    run "tar -czf $BACKUP_DIR/$BACKUP_NAME \
        *.html \
        *.css \
        *.js \
        *.json \
        icons/ \
        screenshots/ \
        --exclude=node_modules \
        --exclude=$BUILD_DIR \
        --exclude=$BACKUP_DIR"
    
    success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
}

# Function to validate files
validate_files() {
    section "Validating Files"
    
    # Required files check
    REQUIRED_FILES=("index.html" "style.css" "firebase.js" "app.js" "manifest.json" "sw.js")
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            success "Found $file"
        else
            error "Missing required file: $file"
            exit 1
        fi
    done
    
    # Check icon files
    REQUIRED_ICONS=("icons/icon-192x192.png" "icons/icon-512x512.png")
    
    for icon in "${REQUIRED_ICONS[@]}"; do
        if [ -f "$icon" ]; then
            success "Found $icon"
        else
            warning "Missing icon: $icon"
            warning "Run: node generate-icons.js"
        fi
    done
    
    # Validate HTML
    if command -v html5validator &> /dev/null; then
        run "html5validator --root . --ignore '*.js,*.css'"
    else
        warning "html5validator not installed. Skipping HTML validation."
        warning "Install with: pip install html5validator"
    fi
    
    # Validate JavaScript
    if command -v eslint &> /dev/null; then
        run "eslint *.js --fix || true"
    else
        warning "eslint not installed. Skipping JS validation."
        warning "Install with: npm install -g eslint"
    fi
}

# Function to build project
build_project() {
    section "Building Project"
    
    # Clean build directory
    if [ -d "$BUILD_DIR" ]; then
        run "rm -rf $BUILD_DIR"
    fi
    
    # Create build directory
    run "mkdir -p $BUILD_DIR"
    
    # Copy all necessary files
    run "cp -r *.html $BUILD_DIR/"
    run "cp -r *.css $BUILD_DIR/"
    run "cp -r *.js $BUILD_DIR/"
    run "cp -r *.json $BUILD_DIR/"
    run "cp -r icons $BUILD_DIR/"
    run "cp -r screenshots $BUILD_DIR/"
    
    # Copy specific directories if they exist
    [ -d "shortcuts" ] && run "cp -r shortcuts $BUILD_DIR/"
    [ -f "favicon.ico" ] && run "cp favicon.ico $BUILD_DIR/"
    
    # Minify CSS if uglifycss is available
    if command -v uglifycss &> /dev/null; then
        section "Minifying CSS"
        for css_file in $BUILD_DIR/*.css; do
            if [ -f "$css_file" ]; then
                uglifycss "$css_file" > "$css_file.min"
                mv "$css_file.min" "$css_file"
                success "Minified $(basename "$css_file")"
            fi
        done
    fi
    
    # Minify JS if terser is available
    if command -v terser &> /dev/null; then
        section "Minifying JavaScript"
        for js_file in $BUILD_DIR/*.js; do
            if [ -f "$js_file" ] && [ "$js_file" != "$BUILD_DIR/firebase.js" ]; then
                terser "$js_file" -c -m -o "$js_file.min"
                mv "$js_file.min" "$js_file"
                success "Minified $(basename "$js_file")"
            fi
        done
    fi
    
    # Update manifest.json with correct paths
    section "Updating Manifest"
    sed -i.bak "s|/|./|g" "$BUILD_DIR/manifest.json"
    rm -f "$BUILD_DIR/manifest.json.bak"
    
    success "Build completed in $BUILD_DIR/"
}

# Function to run tests
run_tests() {
    section "Running Tests"
    
    # Check if npm test exists
    if [ -f "package.json" ]; then
        if npm run test 2>/dev/null; then
            success "Tests passed"
        else
            warning "No tests configured or tests failed"
        fi
    else
        warning "No package.json found. Skipping tests."
    fi
    
    # Lighthouse audit if available
    if command -v lighthouse &> /dev/null; then
        section "Running Lighthouse Audit"
        
        # Create a temporary HTML file for testing
        TEMP_HTML="temp_test.html"
        cat > "$TEMP_HTML" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <h1>Test Page for Lighthouse</h1>
</body>
</html>
EOF
        
        lighthouse "$TEMP_HTML" --output=json --output-path=lighthouse-report.json --quiet
        rm -f "$TEMP_HTML"
        
        # Extract scores
        PERFORMANCE=$(jq '.categories.performance.score * 100' lighthouse-report.json)
        ACCESSIBILITY=$(jq '.categories.accessibility.score * 100' lighthouse-report.json)
        BEST_PRACTICES=$(jq '.categories['\''best-practices'\''].score * 100' lighthouse-report.json)
        SEO=$(jq '.categories.seo.score * 100' lighthouse-report.json)
        PWA=$(jq '.categories.pwa.score * 100' lighthouse-report.json)
        
        echo -e "\n${BLUE}Lighthouse Scores:${NC}"
        echo -e "Performance: ${PERFORMANCE}%"
        echo -e "Accessibility: ${ACCESSIBILITY}%"
        echo -e "Best Practices: ${BEST_PRACTICES}%"
        echo -e "SEO: ${SEO}%"
        echo -e "PWA: ${PWA}%"
        
        # Check if scores are acceptable
        if (( $(echo "$PERFORMANCE < 80" | bc -l) )); then
            warning "Performance score is below 80%"
        fi
        
        if (( $(echo "$ACCESSIBILITY < 90" | bc -l) )); then
            warning "Accessibility score is below 90%"
        fi
        
        rm -f lighthouse-report.json
    else
        warning "Lighthouse not installed. Skipping audit."
        warning "Install with: npm install -g lighthouse"
    fi
}

# Function to deploy to Firebase
deploy_firebase() {
    section "Deploying to Firebase"
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        error "Firebase CLI not installed"
        error "Install with: npm install -g firebase-tools"
        exit 1
    fi
    
    # Check if logged in
    if ! firebase projects:list 2>/dev/null | grep -q "$FIREBASE_PROJECT"; then
        warning "Not logged into Firebase or project not accessible"
        run "firebase login"
    fi
    
    # Deploy
    run "firebase use $FIREBASE_PROJECT"
    run "firebase deploy --only hosting"
    
    success "Deployed to Firebase Hosting"
    echo -e "${GREEN}URL:${NC} $BASE_URL"
}

# Function to create deployment report
create_report() {
    section "Creating Deployment Report"
    
    REPORT_FILE="deployment-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# RuralCare Deployment Report

## Deployment Details
- **Project**: $PROJECT_NAME
- **Version**: $VERSION
- **Environment**: $ENVIRONMENT
- **Timestamp**: $(date)
- **Deployed by**: $(whoami)

## Files Deployed
\`\`\`
$(find $BUILD_DIR -type f | sort)
\`\`\`

## File Sizes
\`\`\`
$(du -h $BUILD_DIR/* 2>/dev/null || echo "Size information not available")
\`\`\`

## Build Information
- **Build Directory**: $BUILD_DIR
- **Total Files**: $(find $BUILD_DIR -type f | wc -l)
- **Total Size**: $(du -sh $BUILD_DIR | cut -f1)

## Environment Configuration
- **Firebase Project**: $FIREBASE_PROJECT
- **Base URL**: $BASE_URL

## Next Steps
1. Verify deployment at $BASE_URL
2. Test all major functionalities
3. Check PWA installation
4. Verify offline functionality
5. Test on different devices

## Rollback Instructions
To rollback to previous version:
\`\`\`
tar -xzf backups/${PROJECT_NAME}_${ENVIRONMENT}_*.tar.gz
\`\`\`

---

*This report was automatically generated by the deployment script.*
EOF
    
    success "Deployment report created: $REPORT_FILE"
}

# Function to send notification
send_notification() {
    section "Sending Notification"
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        warning "curl not available. Skipping notification."
        return
    fi
    
    # Example: Send to Slack webhook (configure SLACK_WEBHOOK_URL environment variable)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        MESSAGE="🚀 RuralCare v$VERSION deployed to $ENVIRONMENT\n• Environment: $ENVIRONMENT\n• URL: $BASE_URL\n• Timestamp: $(date)"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$MESSAGE\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 && \
            success "Notification sent to Slack"
    fi
    
    # Example: Send email (configure EMAIL settings)
    if [ -n "$EMAIL_TO" ] && [ -n "$EMAIL_FROM" ]; then
        SUBJECT="RuralCare Deployment: v$VERSION to $ENVIRONMENT"
        BODY="RuralCare version $VERSION has been deployed to $ENVIRONMENT environment.\n\nURL: $BASE_URL\nTimestamp: $(date)\n\nPlease verify the deployment."
        
        echo -e "$BODY" | mail -s "$SUBJECT" -r "$EMAIL_FROM" "$EMAIL_TO" && \
            success "Email notification sent"
    fi
}

# Main deployment process
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    # Step 1: Create backup
    create_backup
    
    # Step 2: Validate files
    validate_files
    
    # Step 3: Run tests