# Self-signed SSL certificate generation for development
# Run this script to generate SSL certificates for NGINX HTTPS

# Create SSL directory
mkdir -p nginx/ssl

# Generate private key
openssl genrsa -out nginx/ssl/server.key 2048

# Generate certificate signing request
openssl req -new -key nginx/ssl/server.key -out nginx/ssl/server.csr -subj "/C=US/ST=State/L=City/O=Streamply/OU=Development/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in nginx/ssl/server.csr -signkey nginx/ssl/server.key -out nginx/ssl/server.crt

# Set proper permissions
chmod 600 nginx/ssl/server.key
chmod 644 nginx/ssl/server.crt

# Remove CSR file
rm nginx/ssl/server.csr

echo "SSL certificates generated successfully!"
echo "Certificate: nginx/ssl/server.crt"
echo "Private Key: nginx/ssl/server.key"
