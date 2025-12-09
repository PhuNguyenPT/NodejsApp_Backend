#!/bin/bash

# Generate TLS certificates for full-stack application
# - CA (Certificate Authority)
# - Backend server certificates
# - Frontend server certificates (for Vite dev server)
# - Nginx client certificates (for mTLS)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TLS_DIR="./tls"
DAYS_VALID=3650  # 10 years
COUNTRY="VN"
STATE="Ho Chi Minh City"
LOCALITY="HCMC"
ORGANIZATION="Your Organization"
ORGANIZATIONAL_UNIT="IT"
EMAIL="admin@admission.edu.vn"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TLS Certificate Generation Script v2.0             ║${NC}"
echo -e "${BLUE}║     Full-Stack Application Certificates                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Generating certificates for:${NC}"
echo "  • CA (Certificate Authority)"
echo "  • Backend server (Docker + local)"
echo "  • Frontend server (Vite dev server)"
echo "  • Nginx client (mTLS authentication)"
echo ""

# Create TLS directory if it doesn't exist
if [ ! -d "$TLS_DIR" ]; then
    echo -e "${YELLOW}Creating TLS directory...${NC}"
    mkdir -p "$TLS_DIR"
fi

# ============================================================================
# STEP 1: Generate CA (Certificate Authority)
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 1: Generating CA (Certificate Authority)...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

openssl genrsa -out "$TLS_DIR/ca.key" 4096

openssl req -new -x509 -days $DAYS_VALID -key "$TLS_DIR/ca.key" \
    -out "$TLS_DIR/ca.crt" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=Internal CA/emailAddress=$EMAIL"

echo -e "${GREEN}✓ CA certificate created${NC}"
echo ""

# ============================================================================
# STEP 2: Generate Backend Server Certificate
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 2: Generating Backend Server Certificate...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

# Generate backend server key
openssl genrsa -out "$TLS_DIR/backend.key" 4096
echo -e "${GREEN}✓ Backend private key created${NC}"

# Create certificate signing request (CSR)
openssl req -new -key "$TLS_DIR/backend.key" \
    -out "$TLS_DIR/backend.csr" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=backend/emailAddress=$EMAIL"

echo -e "${GREEN}✓ Backend CSR created${NC}"

# Create SAN (Subject Alternative Names) configuration for backend
cat > "$TLS_DIR/backend-san.cnf" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = $COUNTRY
ST = $STATE
L = $LOCALITY
O = $ORGANIZATION
OU = $ORGANIZATIONAL_UNIT
CN = backend
emailAddress = $EMAIL

[v3_req]
keyUsage = keyEncipherment, dataEncipherment, digitalSignature
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = backend
DNS.2 = backend-dev
DNS.3 = backend-staging
DNS.4 = backend-prod
DNS.5 = backend_secure
DNS.6 = localhost
IP.1 = 127.0.0.1
IP.2 = 172.19.0.2
IP.3 = 172.18.0.2
IP.4 = 172.20.0.2
EOF

# Sign the backend certificate with CA
openssl x509 -req -in "$TLS_DIR/backend.csr" \
    -CA "$TLS_DIR/ca.crt" \
    -CAkey "$TLS_DIR/ca.key" \
    -CAcreateserial \
    -out "$TLS_DIR/backend.crt" \
    -days $DAYS_VALID \
    -sha256 \
    -extensions v3_req \
    -extfile "$TLS_DIR/backend-san.cnf"

echo -e "${GREEN}✓ Backend certificate signed by CA${NC}"
echo ""

# ============================================================================
# STEP 3: Generate Frontend Server Certificate (for Vite)
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 3: Generating Frontend Server Certificate (Vite)...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

# Generate frontend server key
openssl genrsa -out "$TLS_DIR/frontend.key" 4096
echo -e "${GREEN}✓ Frontend private key created${NC}"

# Create certificate signing request (CSR)
openssl req -new -key "$TLS_DIR/frontend.key" \
    -out "$TLS_DIR/frontend.csr" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=localhost/emailAddress=$EMAIL"

echo -e "${GREEN}✓ Frontend CSR created${NC}"

# Create SAN configuration for frontend
cat > "$TLS_DIR/frontend-san.cnf" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = $COUNTRY
ST = $STATE
L = $LOCALITY
O = $ORGANIZATION
OU = $ORGANIZATIONAL_UNIT
CN = localhost
emailAddress = $EMAIL

[v3_req]
keyUsage = keyEncipherment, dataEncipherment, digitalSignature
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Sign the frontend certificate with CA
openssl x509 -req -in "$TLS_DIR/frontend.csr" \
    -CA "$TLS_DIR/ca.crt" \
    -CAkey "$TLS_DIR/ca.key" \
    -CAcreateserial \
    -out "$TLS_DIR/frontend.crt" \
    -days $DAYS_VALID \
    -sha256 \
    -extensions v3_req \
    -extfile "$TLS_DIR/frontend-san.cnf"

echo -e "${GREEN}✓ Frontend certificate signed by CA${NC}"
echo ""

# ============================================================================
# STEP 4: Generate Client Certificate for mTLS (Nginx)
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 4: Generating Client Certificate for mTLS (Nginx)...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

# Generate Nginx client key
openssl genrsa -out "$TLS_DIR/nginx-client.key" 4096
echo -e "${GREEN}✓ Nginx client private key created${NC}"

# Create client CSR with proper extensions
cat > "$TLS_DIR/client.cnf" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = $COUNTRY
ST = $STATE
L = $LOCALITY
O = $ORGANIZATION
OU = $ORGANIZATIONAL_UNIT
CN = nginx-client
emailAddress = $EMAIL

[v3_req]
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth
EOF

# Create client CSR
openssl req -new -key "$TLS_DIR/nginx-client.key" \
    -out "$TLS_DIR/nginx-client.csr" \
    -config "$TLS_DIR/client.cnf"

echo -e "${GREEN}✓ Nginx client CSR created${NC}"

# Sign client certificate
openssl x509 -req -in "$TLS_DIR/nginx-client.csr" \
    -CA "$TLS_DIR/ca.crt" \
    -CAkey "$TLS_DIR/ca.key" \
    -CAcreateserial \
    -out "$TLS_DIR/nginx-client.crt" \
    -days $DAYS_VALID \
    -sha256 \
    -extensions v3_req \
    -extfile "$TLS_DIR/client.cnf"

echo -e "${GREEN}✓ Nginx client certificate signed by CA${NC}"
echo ""

# ============================================================================
# STEP 5: Set Permissions
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 5: Setting file permissions...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

chmod 600 "$TLS_DIR"/*.key
chmod 644 "$TLS_DIR"/*.crt
echo -e "${GREEN}✓ Permissions set (keys: 600, certs: 644)${NC}"
echo ""

# ============================================================================
# STEP 6: Clean up temporary files
# ============================================================================
echo -e "${GREEN}Step 6: Cleaning up temporary files...${NC}"
rm -f "$TLS_DIR"/*.csr "$TLS_DIR"/*.srl "$TLS_DIR"/*.cnf
echo -e "${GREEN}✓ Temporary files removed${NC}"
echo ""

# ============================================================================
# STEP 7: Verify all certificates
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 7: Verifying all certificates...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}Backend Certificate:${NC}"
openssl verify -CAfile "$TLS_DIR/ca.crt" "$TLS_DIR/backend.crt"

echo -e "${YELLOW}Frontend Certificate:${NC}"
openssl verify -CAfile "$TLS_DIR/ca.crt" "$TLS_DIR/frontend.crt"

echo -e "${YELLOW}Nginx Client Certificate:${NC}"
openssl verify -CAfile "$TLS_DIR/ca.crt" "$TLS_DIR/nginx-client.crt"

echo ""

# ============================================================================
# Display Certificate Information
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Certificate Details Summary                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}=== Backend Server Certificate ===${NC}"
echo -e "${YELLOW}Subject:${NC}"
openssl x509 -in "$TLS_DIR/backend.crt" -text -noout | grep "Subject:" | head -1
echo -e "${YELLOW}Subject Alternative Names:${NC}"
openssl x509 -in "$TLS_DIR/backend.crt" -text -noout | grep -A 10 "Subject Alternative Name" | grep -E "DNS|IP"
echo -e "${YELLOW}Extended Key Usage:${NC}"
openssl x509 -in "$TLS_DIR/backend.crt" -text -noout | grep -A 1 "Extended Key Usage"
echo ""

echo -e "${GREEN}=== Frontend Server Certificate ===${NC}"
echo -e "${YELLOW}Subject:${NC}"
openssl x509 -in "$TLS_DIR/frontend.crt" -text -noout | grep "Subject:" | head -1
echo -e "${YELLOW}Subject Alternative Names:${NC}"
openssl x509 -in "$TLS_DIR/frontend.crt" -text -noout | grep -A 10 "Subject Alternative Name" | grep -E "DNS|IP"
echo -e "${YELLOW}Extended Key Usage:${NC}"
openssl x509 -in "$TLS_DIR/frontend.crt" -text -noout | grep -A 1 "Extended Key Usage"
echo ""

echo -e "${GREEN}=== Nginx Client Certificate (mTLS) ===${NC}"
echo -e "${YELLOW}Subject:${NC}"
openssl x509 -in "$TLS_DIR/nginx-client.crt" -text -noout | grep "Subject:" | head -1
echo -e "${YELLOW}Extended Key Usage:${NC}"
openssl x509 -in "$TLS_DIR/nginx-client.crt" -text -noout | grep -A 1 "Extended Key Usage"
echo ""

echo -e "${GREEN}=== Validity Period ===${NC}"
echo -e "${YELLOW}Backend:${NC}"
openssl x509 -in "$TLS_DIR/backend.crt" -text -noout | grep -A 2 "Validity"
echo ""

# ============================================================================
# Display Generated Files
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Generated Files:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
ls -lh "$TLS_DIR"
echo ""

# ============================================================================
# Summary and Usage Instructions
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Setup Complete! ✓                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Certificate Authority:${NC}"
echo -e "  📄 CA Certificate: ${YELLOW}$TLS_DIR/ca.crt${NC}"
echo -e "  🔑 CA Key: ${YELLOW}$TLS_DIR/ca.key${NC}"
echo ""

echo -e "${GREEN}Backend Server (Docker + Local):${NC}"
echo -e "  📄 Certificate: ${YELLOW}$TLS_DIR/backend.crt${NC}"
echo -e "  🔑 Private Key: ${YELLOW}$TLS_DIR/backend.key${NC}"
echo -e "  🎯 Purpose: HTTPS server on port 3443"
echo -e "  🌐 Valid for: backend, backend-*, localhost, 127.0.0.1"
echo ""

echo -e "${GREEN}Frontend Server (Vite Dev):${NC}"
echo -e "  📄 Certificate: ${YELLOW}$TLS_DIR/frontend.crt${NC}"
echo -e "  🔑 Private Key: ${YELLOW}$TLS_DIR/frontend.key${NC}"
echo -e "  🎯 Purpose: HTTPS server on port 5173 (Vite)"
echo -e "  🌐 Valid for: localhost, 127.0.0.1, ::1"
echo ""

echo -e "${GREEN}Nginx Client (mTLS):${NC}"
echo -e "  📄 Certificate: ${YELLOW}$TLS_DIR/nginx-client.crt${NC}"
echo -e "  🔑 Private Key: ${YELLOW}$TLS_DIR/nginx-client.key${NC}"
echo -e "  🎯 Purpose: Client authentication to backend"
echo -e "  🔐 Used for: mTLS (mutual TLS)"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}1. Trust the CA certificate in your browser:${NC}"
echo "   • Chrome/Chromium: chrome://settings/certificates"
echo "   • Firefox: Settings → Privacy & Security → Certificates"
echo "   • Or system-wide (Linux): sudo cp $TLS_DIR/ca.crt /usr/local/share/ca-certificates/my-dev-ca.crt && sudo update-ca-certificates"
echo ""

echo -e "${YELLOW}2. Use certificates in your applications:${NC}"
echo "   • Backend: Already configured in Docker secrets"
echo "   • Frontend: Add to vite.config.ts (see documentation)"
echo "   • Nginx: Already configured in Docker secrets"
echo ""

echo -e "${YELLOW}3. Access your applications:${NC}"
echo "   • Frontend Dev: https://localhost:5173"
echo "   • Backend Dev: https://localhost:3443/api"
echo "   • Backend Docker: https://backend:3443/api"
echo ""

echo -e "${RED}⚠️  Important Security Notes:${NC}"
echo -e "${RED}   • These are self-signed certificates for development/internal use only${NC}"
echo -e "${RED}   • Do NOT use these for public-facing production services${NC}"
echo -e "${RED}   • Keep private keys (.key files) secure and never commit to git${NC}"
echo -e "${RED}   • For production, use certificates from a trusted CA (Let's Encrypt, etc.)${NC}"
echo ""

echo -e "${GREEN}Certificate generation completed successfully! 🎉${NC}"