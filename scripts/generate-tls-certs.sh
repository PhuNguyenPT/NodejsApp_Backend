#!/bin/bash

# Generate TLS certificates for backend-frontend communication
# This creates self-signed certificates for internal Docker network use

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TLS_DIR="./tls"
DAYS_VALID=3650  # 10 years
COUNTRY="VN"
STATE="Ho Chi Minh City"
LOCALITY="HCMC"
ORGANIZATION="Your Organization"
ORGANIZATIONAL_UNIT="IT"
COMMON_NAME="backend"
EMAIL="admin@admission.edu.vn"

echo -e "${GREEN}=== TLS Certificate Generation ===${NC}"
echo "Creating certificates for internal Docker network communication"
echo ""

# Create TLS directory if it doesn't exist
if [ ! -d "$TLS_DIR" ]; then
    echo -e "${YELLOW}Creating TLS directory...${NC}"
    mkdir -p "$TLS_DIR"
fi

# Generate CA (Certificate Authority) key and certificate
echo -e "${GREEN}Step 1: Generating CA certificate...${NC}"
openssl genrsa -out "$TLS_DIR/ca.key" 4096

openssl req -new -x509 -days $DAYS_VALID -key "$TLS_DIR/ca.key" \
    -out "$TLS_DIR/ca.crt" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=Internal CA/emailAddress=$EMAIL"

echo -e "${GREEN}✓ CA certificate created${NC}"

# Generate backend server key
echo -e "${GREEN}Step 2: Generating backend server private key...${NC}"
openssl genrsa -out "$TLS_DIR/backend.key" 4096
echo -e "${GREEN}✓ Backend private key created${NC}"

# Create certificate signing request (CSR)
echo -e "${GREEN}Step 3: Creating certificate signing request...${NC}"
openssl req -new -key "$TLS_DIR/backend.key" \
    -out "$TLS_DIR/backend.csr" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$COMMON_NAME/emailAddress=$EMAIL"

echo -e "${GREEN}✓ CSR created${NC}"

# Create SAN (Subject Alternative Names) configuration
echo -e "${GREEN}Step 4: Creating SAN configuration...${NC}"
cat > "$TLS_DIR/san.cnf" << EOF
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
CN = $COMMON_NAME
emailAddress = $EMAIL

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
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

echo -e "${GREEN}✓ SAN configuration created${NC}"

# Sign the certificate with CA
echo -e "${GREEN}Step 5: Signing backend certificate with CA...${NC}"
openssl x509 -req -in "$TLS_DIR/backend.csr" \
    -CA "$TLS_DIR/ca.crt" \
    -CAkey "$TLS_DIR/ca.key" \
    -CAcreateserial \
    -out "$TLS_DIR/backend.crt" \
    -days $DAYS_VALID \
    -sha256 \
    -extensions v3_req \
    -extfile "$TLS_DIR/san.cnf"

echo -e "${GREEN}✓ Backend certificate signed${NC}"

# Optional: Generate client certificates for mTLS (mutual TLS)
echo ""
read -p "Do you want to generate client certificates for mTLS? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Step 6: Generating client certificates for mTLS...${NC}"
    
    # Generate Nginx client key
    openssl genrsa -out "$TLS_DIR/nginx-client.key" 4096
    
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
    
    echo -e "${GREEN}✓ Client certificates created for mTLS${NC}"
    
    # Clean up client config
    rm -f "$TLS_DIR/client.cnf"
fi

# Set proper permissions
echo -e "${GREEN}Step 7: Setting file permissions...${NC}"
chmod 600 "$TLS_DIR"/*.key
chmod 644 "$TLS_DIR"/*.crt
echo -e "${GREEN}✓ Permissions set${NC}"

# Clean up temporary files
rm -f "$TLS_DIR"/*.csr "$TLS_DIR"/*.srl "$TLS_DIR/san.cnf"

# Verify certificates
echo ""
echo -e "${GREEN}=== Verifying Certificates ===${NC}"
openssl verify -CAfile "$TLS_DIR/ca.crt" "$TLS_DIR/backend.crt"
if [ -f "$TLS_DIR/nginx-client.crt" ]; then
    openssl verify -CAfile "$TLS_DIR/ca.crt" "$TLS_DIR/nginx-client.crt"
fi

# Display certificate information
echo ""
echo -e "${GREEN}=== Backend Certificate Information ===${NC}"
echo -e "${YELLOW}Subject:${NC}"
openssl x509 -in "$TLS_DIR/backend.crt" -text -noout | grep -A 2 "Subject:"
echo ""
echo -e "${YELLOW}Subject Alternative Names:${NC}"
openssl x509 -in "$TLS_DIR/backend.crt" -text -noout | grep -A 10 "Subject Alternative Name"
echo ""
echo -e "${YELLOW}Validity:${NC}"
openssl x509 -in "$TLS_DIR/backend.crt" -text -noout | grep -A 2 "Validity"

if [ -f "$TLS_DIR/nginx-client.crt" ]; then
    echo ""
    echo -e "${GREEN}=== Client Certificate Information ===${NC}"
    echo -e "${YELLOW}Subject:${NC}"
    openssl x509 -in "$TLS_DIR/nginx-client.crt" -text -noout | grep -A 2 "Subject:"
    echo ""
    echo -e "${YELLOW}Extended Key Usage:${NC}"
    openssl x509 -in "$TLS_DIR/nginx-client.crt" -text -noout | grep -A 2 "Extended Key Usage"
fi

echo ""
echo -e "${GREEN}=== Generated Files ===${NC}"
ls -lh "$TLS_DIR"

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo -e "✓ CA Certificate: $TLS_DIR/ca.crt"
echo -e "✓ Backend Certificate: $TLS_DIR/backend.crt"
echo -e "✓ Backend Key: $TLS_DIR/backend.key"

if [ -f "$TLS_DIR/nginx-client.crt" ]; then
    echo -e "✓ Client Certificate: $TLS_DIR/nginx-client.crt"
    echo -e "✓ Client Key: $TLS_DIR/nginx-client.key"
fi

echo ""
echo -e "${YELLOW}Supported Hostnames in Certificate:${NC}"
echo "  • backend (generic)"
echo "  • backend-dev (development)"
echo "  • backend-staging (staging)"
echo "  • backend-prod (production)"
echo "  • backend_secure (nginx upstream name)"
echo "  • localhost"

echo -e "${RED}Important: These are self-signed certificates for internal use only!${NC}"
echo -e "${RED}Do NOT use these for public-facing services.${NC}"