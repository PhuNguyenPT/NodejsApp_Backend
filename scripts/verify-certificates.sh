#!/bin/bash

# Verify TLS certificates
# This script checks if all certificates are valid and properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TLS_DIR="./tls"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        TLS Certificate Verification Tool               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if TLS directory exists
if [ ! -d "$TLS_DIR" ]; then
    echo -e "${RED}✗ TLS directory not found: $TLS_DIR${NC}"
    echo -e "${YELLOW}  Run ./generate-tls-certificates.sh first${NC}"
    exit 1
fi

# Function to check if file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description: ${YELLOW}$file${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} $description: ${RED}NOT FOUND${NC} ($file)"
        return 1
    fi
}

# Function to verify certificate
verify_cert() {
    local cert=$1
    local ca=$2
    local name=$3
    
    echo ""
    echo -e "${BLUE}─────────────────────────────────────────────────────${NC}"
    echo -e "${GREEN}Verifying: $name${NC}"
    echo -e "${BLUE}─────────────────────────────────────────────────────${NC}"
    
    # Check basic verification
    if openssl verify -CAfile "$ca" "$cert" 2>&1 | grep -q "OK"; then
        echo -e "${GREEN}✓ Certificate verification: PASSED${NC}"
    else
        echo -e "${RED}✗ Certificate verification: FAILED${NC}"
        return 1
    fi
    
    # Check expiry
    local expiry_date=$(openssl x509 -in "$cert" -noout -enddate | cut -d= -f2)
    local expiry_timestamp=$(date -d "$expiry_date" +%s)
    local current_timestamp=$(date +%s)
    local days_left=$(( ($expiry_timestamp - $current_timestamp) / 86400 ))
    
    echo -e "${YELLOW}Expiry:${NC} $expiry_date"
    echo -e "${YELLOW}Days remaining:${NC} $days_left days"
    
    if [ $days_left -lt 30 ]; then
        echo -e "${RED}⚠️  Certificate expires in less than 30 days!${NC}"
    fi
    
    # Show subject
    echo -e "${YELLOW}Subject:${NC}"
    openssl x509 -in "$cert" -noout -subject | sed 's/subject=/  /'
    
    # Show issuer
    echo -e "${YELLOW}Issuer:${NC}"
    openssl x509 -in "$cert" -noout -issuer | sed 's/issuer=/  /'
    
    # Show key usage
    echo -e "${YELLOW}Key Usage:${NC}"
    openssl x509 -in "$cert" -noout -text | grep -A 1 "X509v3 Key Usage:" | tail -1 | sed 's/^/  /'
    
    # Show extended key usage
    echo -e "${YELLOW}Extended Key Usage:${NC}"
    openssl x509 -in "$cert" -noout -text | grep -A 1 "X509v3 Extended Key Usage:" | tail -1 | sed 's/^/  /'
    
    # Show SAN if exists
    if openssl x509 -in "$cert" -noout -text | grep -q "Subject Alternative Name"; then
        echo -e "${YELLOW}Subject Alternative Names:${NC}"
        openssl x509 -in "$cert" -noout -text | grep -A 10 "Subject Alternative Name" | grep -E "DNS|IP" | sed 's/^/  /'
    fi
    
    return 0
}

# Function to check key pair match
check_key_pair() {
    local cert=$1
    local key=$2
    local name=$3
    
    echo ""
    echo -e "${BLUE}Checking key pair match for: $name${NC}"
    
    local cert_modulus=$(openssl x509 -in "$cert" -noout -modulus | openssl md5)
    local key_modulus=$(openssl rsa -in "$key" -noout -modulus 2>/dev/null | openssl md5)
    
    if [ "$cert_modulus" == "$key_modulus" ]; then
        echo -e "${GREEN}✓ Certificate and private key match${NC}"
        return 0
    else
        echo -e "${RED}✗ Certificate and private key DO NOT match!${NC}"
        return 1
    fi
}

# Check all required files
echo -e "${GREEN}Checking required files...${NC}"
echo ""

all_files_exist=true

check_file "$TLS_DIR/ca.crt" "CA Certificate" || all_files_exist=false
check_file "$TLS_DIR/ca.key" "CA Private Key" || all_files_exist=false
check_file "$TLS_DIR/backend.crt" "Backend Certificate" || all_files_exist=false
check_file "$TLS_DIR/backend.key" "Backend Private Key" || all_files_exist=false
check_file "$TLS_DIR/frontend.crt" "Frontend Certificate" || all_files_exist=false
check_file "$TLS_DIR/frontend.key" "Frontend Private Key" || all_files_exist=false
check_file "$TLS_DIR/nginx-client.crt" "Nginx Client Certificate" || all_files_exist=false
check_file "$TLS_DIR/nginx-client.key" "Nginx Client Private Key" || all_files_exist=false

if [ "$all_files_exist" = false ]; then
    echo ""
    echo -e "${RED}✗ Some required files are missing!${NC}"
    echo -e "${YELLOW}  Run ./generate-tls-certificates.sh to generate all certificates${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All required files exist${NC}"

# Verify all certificates
verify_cert "$TLS_DIR/backend.crt" "$TLS_DIR/ca.crt" "Backend Server Certificate"
verify_cert "$TLS_DIR/frontend.crt" "$TLS_DIR/ca.crt" "Frontend Server Certificate"
verify_cert "$TLS_DIR/nginx-client.crt" "$TLS_DIR/ca.crt" "Nginx Client Certificate"

# Check key pairs
check_key_pair "$TLS_DIR/backend.crt" "$TLS_DIR/backend.key" "Backend"
check_key_pair "$TLS_DIR/frontend.crt" "$TLS_DIR/frontend.key" "Frontend"
check_key_pair "$TLS_DIR/nginx-client.crt" "$TLS_DIR/nginx-client.key" "Nginx Client"

# Check file permissions
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Checking file permissions...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

check_permissions() {
    local file=$1
    local expected=$2
    local description=$3
    
    local actual=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%Lp" "$file")
    
    if [ "$actual" == "$expected" ]; then
        echo -e "${GREEN}✓${NC} $description: $actual"
    else
        echo -e "${YELLOW}⚠${NC}  $description: $actual (expected: $expected)"
        echo -e "   Run: chmod $expected $file"
    fi
}

check_permissions "$TLS_DIR/ca.key" "600" "CA Key"
check_permissions "$TLS_DIR/backend.key" "600" "Backend Key"
check_permissions "$TLS_DIR/frontend.key" "600" "Frontend Key"
check_permissions "$TLS_DIR/nginx-client.key" "600" "Nginx Client Key"
check_permissions "$TLS_DIR/ca.crt" "644" "CA Certificate"
check_permissions "$TLS_DIR/backend.crt" "644" "Backend Certificate"
check_permissions "$TLS_DIR/frontend.crt" "644" "Frontend Certificate"
check_permissions "$TLS_DIR/nginx-client.crt" "644" "Nginx Client Certificate"

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Verification Summary                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Certificate Usage Guide:${NC}"
echo ""
echo -e "${YELLOW}Backend (Node.js/Express):${NC}"
echo "  • Certificate: $TLS_DIR/backend.crt"
echo "  • Private Key: $TLS_DIR/backend.key"
echo "  • CA: $TLS_DIR/ca.crt"
echo "  • Port: 3443"
echo "  • Access: https://localhost:3443/api"
echo ""

echo -e "${YELLOW}Frontend (Vite):${NC}"
echo "  • Certificate: $TLS_DIR/frontend.crt"
echo "  • Private Key: $TLS_DIR/frontend.key"
echo "  • Port: 5173"
echo "  • Access: https://localhost:5173"
echo ""

echo -e "${YELLOW}Nginx (mTLS Client):${NC}"
echo "  • Certificate: $TLS_DIR/nginx-client.crt"
echo "  • Private Key: $TLS_DIR/nginx-client.key"
echo "  • Purpose: Authenticate Nginx to Backend"
echo ""

echo -e "${GREEN}All certificates are valid and properly configured! ✓${NC}"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Trust the CA certificate in your browser/system"
echo "  2. Configure your applications to use these certificates"
echo "  3. Test HTTPS connections"
echo ""