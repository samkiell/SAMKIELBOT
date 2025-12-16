#!/bin/bash

# SAMKIEL BOT - Refactoring Verification Script
# This script verifies that the refactoring was successful

echo "🔍 SAMKIEL BOT - Refactoring Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((FAILED++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        ((FAILED++))
    fi
}

echo "📁 Checking Directory Structure..."
echo "-----------------------------------"
check_dir "pages"
check_dir "pages/api"
check_dir "pages/api/auth"
check_dir "pages/api/deploy"
check_dir "pages/api/admin"
check_dir "pages/api/credits"
check_dir "pages/api/payments"
check_dir "pages/api/update"
check_dir "lib"
check_dir "lib/controllers"
check_dir "lib/services"
check_dir "lib/utils"
check_dir "models"
check_dir "components"
check_dir "context"
check_dir "public"
check_dir "styles"
echo ""

echo "📄 Checking Core Files..."
echo "-----------------------------------"
check_file "server.js"
check_file "package.json"
check_file "next.config.js"
check_file "jsconfig.json"
check_file ".env.example"
check_file ".gitignore"
check_file "middleware.js"
check_file "tailwind.config.js"
check_file "postcss.config.js"
echo ""

echo "🔌 Checking API Routes..."
echo "-----------------------------------"
check_file "pages/api/auth/[...slug].js"
check_file "pages/api/deploy/[...slug].js"
check_file "pages/api/admin/[...slug].js"
check_file "pages/api/credits/[...slug].js"
check_file "pages/api/payments/[...slug].js"
check_file "pages/api/update/[...slug].js"
check_file "pages/api/[...slug].js"
echo ""

echo "🧩 Checking Core Modules..."
echo "-----------------------------------"
check_file "lib/db.js"
check_file "lib/api.js"
check_file "lib/auth.js"
check_file "lib/utils/authMiddleware.js"
check_file "lib/utils/pterodactyl.js"
check_file "lib/utils/scheduler.js"
echo ""

echo "🗄️ Checking Models..."
echo "-----------------------------------"
check_file "models/User.js"
check_file "models/Deployment.js"
check_file "models/CreditTransaction.js"
check_file "models/PaymentTransaction.js"
check_file "models/Referral.js"
check_file "models/Notification.js"
echo ""

echo "📚 Checking Documentation..."
echo "-----------------------------------"
check_file "README.md"
check_file "QUICK_START.md"
check_file "REFACTOR_COMPLETE.md"
check_file "REFACTOR_SUMMARY.md"
check_file "POST_REFACTOR_TODO.md"
echo ""

echo "🔧 Checking Configuration..."
echo "-----------------------------------"
if [ -f "package.json" ]; then
    if grep -q '"dev": "node server.js"' package.json; then
        echo -e "${GREEN}✓${NC} Dev script configured"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Dev script not configured"
        ((FAILED++))
    fi
    
    if grep -q '"start": "NODE_ENV=production node server.js"' package.json; then
        echo -e "${GREEN}✓${NC} Start script configured"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Start script not configured"
        ((FAILED++))
    fi
    
    if grep -q '"build": "next build"' package.json; then
        echo -e "${GREEN}✓${NC} Build script configured"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Build script not configured"
        ((FAILED++))
    fi
fi
echo ""

echo "⚠️ Checking for Old Structure..."
echo "-----------------------------------"
if [ -d "backend" ]; then
    echo -e "${YELLOW}⚠${NC} backend/ directory still exists (should be removed after verification)"
else
    echo -e "${GREEN}✓${NC} backend/ directory removed"
fi

if [ -d "frontend" ]; then
    echo -e "${YELLOW}⚠${NC} frontend/ directory still exists (should be removed after verification)"
else
    echo -e "${GREEN}✓${NC} frontend/ directory removed"
fi
echo ""

echo "📦 Checking Dependencies..."
echo "-----------------------------------"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} node_modules not found (run: npm install)"
    ((FAILED++))
fi

if [ -f "package-lock.json" ]; then
    echo -e "${GREEN}✓${NC} package-lock.json exists"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} package-lock.json not found"
fi
echo ""

echo "=========================================="
echo "📊 VERIFICATION SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ REFACTORING VERIFIED SUCCESSFULLY!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure .env file"
    echo "2. Run: npm run dev"
    echo "3. Test all features"
    echo "4. Remove backend/ and frontend/ directories"
    echo ""
else
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo ""
    echo "Please check the missing files/directories above."
    echo ""
fi

exit $FAILED
