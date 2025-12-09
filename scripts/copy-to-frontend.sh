#!/bin/bash

# Quick copy certificates from backend to frontend
# Run this from the backend directory

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect if we're in backend or frontend directory
if [[ "$PWD" == *"NodejsApp_Backend"* ]]; then
    BACKEND_DIR="$PWD"
    FRONTEND_DIR="$HOME/ReactJS_Frontend"
elif [[ "$PWD" == *"ReactJS_Frontend"* ]]; then
    BACKEND_DIR="$HOME/NodejsApp_Backend"
    FRONTEND_DIR="$PWD"
else
    BACKEND_DIR="$HOME/NodejsApp_Backend"
    FRONTEND_DIR="$HOME/ReactJS_Frontend"
fi

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Copy Certificates to Frontend            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check backend certificates exist
if [ ! -f "$BACKEND_DIR/tls/ca.crt" ] || [ ! -f "$BACKEND_DIR/tls/frontend.crt" ]; then
    echo -e "${RED}✗ Backend certificates not found!${NC}"
    echo -e "${YELLOW}  Expected in: $BACKEND_DIR/tls/${NC}"
    echo -e "${YELLOW}  Run: cd $BACKEND_DIR/scripts && ./generate-tls-certs.sh${NC}"
    exit 1
fi

echo -e "${GREEN}Source: $BACKEND_DIR/tls${NC}"
echo -e "${GREEN}Target: $FRONTEND_DIR/tls${NC}"
echo ""

# Create frontend tls directory
mkdir -p "$FRONTEND_DIR/tls"

# Copy files
echo -e "${YELLOW}Copying certificates...${NC}"
cp "$BACKEND_DIR/tls/ca.crt" "$FRONTEND_DIR/tls/"
echo -e "${GREEN}✓${NC} ca.crt"

cp "$BACKEND_DIR/tls/frontend.crt" "$FRONTEND_DIR/tls/"
echo -e "${GREEN}✓${NC} frontend.crt"

cp "$BACKEND_DIR/tls/frontend.key" "$FRONTEND_DIR/tls/"
echo -e "${GREEN}✓${NC} frontend.key"

cp "$BACKEND_DIR/tls/nginx-client.crt" "$FRONTEND_DIR/tls/"
echo -e "${GREEN}✓${NC} nginx-client.crt"

cp "$BACKEND_DIR/tls/nginx-client.key" "$FRONTEND_DIR/tls/"
echo -e "${GREEN}✓${NC} nginx-client.key"

# Optional: copy backend cert for reference
cp "$BACKEND_DIR/tls/backend.crt" "$FRONTEND_DIR/tls/"
echo -e "${GREEN}✓${NC} backend.crt (reference)"

echo ""

# Set permissions
chmod 600 "$FRONTEND_DIR/tls"/*.key 2>/dev/null
chmod 644 "$FRONTEND_DIR/tls"/*.crt 2>/dev/null
echo -e "${GREEN}✓ Permissions set${NC}"

# Verify
echo ""
echo -e "${YELLOW}Verifying...${NC}"
cd "$FRONTEND_DIR"
if openssl verify -CAfile ./tls/ca.crt ./tls/frontend.crt 2>&1 | grep -q "OK"; then
    echo -e "${GREEN}✓ Frontend certificate: VERIFIED${NC}"
else
    echo -e "${RED}✗ Verification failed!${NC}"
fi

echo ""
echo -e "${GREEN}Files copied to frontend:${NC}"
ls -lh "$FRONTEND_DIR/tls"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Done! ✓                                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next: Trust the CA certificate${NC}"
echo -e "sudo cp $FRONTEND_DIR/tls/ca.crt /usr/local/share/ca-certificates/my-dev-ca.crt"
echo -e "sudo update-ca-certificates"