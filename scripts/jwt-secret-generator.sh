#!/bin/bash

# Generate a secure JWT secret using openssl
echo "Generating secure JWT secret..."

# Method 1: Generate 64-byte random string (base64 encoded)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

echo "Generated JWT Secret:"
echo "$JWT_SECRET"

# Optional: Save to .env file
read -p "Save to .env file? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "JWT_SECRET=$JWT_SECRET" >> .env
  echo "JWT secret saved to .env file"
fi

# Alternative methods (commented out)
# Method 2: Generate hex string
# JWT_SECRET_HEX=$(openssl rand -hex 32)

# Method 3: Using /dev/urandom (Linux/macOS)
# JWT_SECRET_URANDOM=$(head -c 64 /dev/urandom | base64 | tr -d '\n')