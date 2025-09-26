# SecuX Cyber Athena

**Bitcoin multi-signature wallet with hardware security and FIDO2 authentication**

A comprehensive digital asset solution designed for small and medium-sized enterprises (SMEs), combining hardware security modules (HSM), passwordless authentication (FIDO), and multi-signature governance to deliver institutional-level security.

[![Demo](https://img.shields.io/badge/🌐_Live_Demo-cyber--athena.vercel.app-blue)](https://cyber-athena.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.2-2D3748)](https://prisma.io)

## ✨ Core Features

- **🗝️ Hardware Security Module (HSM)** - Secure key storage with PUF technology
- **🛡️ FIDO2 Authentication** - Passwordless, phishing-resistant authentication
- **📝 Multi-Signature Governance** - Require multiple approvals for transactions
- **🔒 Zero-Trust Architecture** - Comprehensive input validation and rate limiting

## 🏗️ Architecture Overview

SecuX Cyber Athena implements a layered architecture combining modern web technologies with enterprise-grade security modules:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                               │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────┤
│   Frontend UI   │   Components    │    Modals       │    Forms            │
│   (Next.js 15)  │                 │                 │                     │
│ • React 18      │ • Dashboard     │ • FIDO2 Auth    │ • Wallet Creation   │
│ • TypeScript    │ • Wallet Mgmt   │ • Confirmations │ • Transaction Forms │
│ • Bootstrap 5   │ • Transactions  │ • Passphrases   │ • Input Validation  │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           API LAYER (Next.js)                             │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────┤
│   Middleware    │   Authentication│    Validation   │    Rate Limiting    │
│                 │                 │                 │                     │
│ • CORS Headers  │ • JWT Tokens    │ • Zod Schemas   │ • IP-based Limits   │
│ • Error Handler │ • FIDO2 WebAuthn│ • Input Sanitize│ • Endpoint Throttle │
│ • Security      │ • Session Mgmt  │ • Type Safety   │ • DoS Protection    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                             │
├─────────────────┬─────────────────┬─────────────────┬───────────────────┤
│   Wallet Mgmt   │   Transaction   │    HSM Ops      │    FIDO2 Flows    │
│                 │                 │                 │                   │
│ • Multi-sig     │ • Initiation    │ • Key Derivation│ • Registration    │
│ • Key Derivation│ • Approval Flow │ • Signing       │ • Authentication  │
│ • Address Gen   │ • Status Track  │ • Public Keys   │ • Challenge Store │
└─────────────────┴─────────────────┴─────────────────┴───────────────────┘
                         │                     │
                         ▼                     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   External HSM  │    │   Bitcoin RPC   │
│  (PostgreSQL)   │    │  (SecuX Vault)  │    │   (Public Node) │
│                 │    │                 │    │                 │
│ • Users & Creds │    │ • Private Keys  │    │ • Balance Query │
│ • Wallets       │    │ • Secure Signing│    │ • Tx Broadcast  │
│ • Transactions  │    │ • PUF Technology│    │ • Fee Estimation│
│ • Approvals     │    │ • Hardware Auth │    │ • Block Info    │
│ • Audit Logs    │    │ • Tamper Resist │    │ • Mempool Data  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Architectural Principles

- **Zero-Trust Security**: All inputs validated, all communications authenticated
- **Defense in Depth**: Multiple security layers (FIDO2, HSM, rate limiting, validation)
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers
- **Hardware-Backed Security**: Private keys never leave the HSM environment
- **Stateless API Design**: JWT-based authentication with no server-side sessions

## 📋 Prerequisites

- **Node.js** v20.18.3 or higher
- **PostgreSQL** v17.4 or higher
- **Modern Browser** with WebAuthn support
- **SecuX Hardware** (optional, for production use)

## 🚀 Quick Start

### 1. Clone & Setup
```bash
# Clone the repository
git clone https://github.com/secuxtech/SecuX-Cyber-Athena.git
cd SecuX-Cyber-Athena

# Install dependencies
npm install
```

### 2. Configuration
```bash
# Copy and edit environment configuration
cp .env.example .env
```

### 3. Database Setup
```bash
# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# (Optional) Reset database if needed
# npx prisma migrate reset
```

### 4. Start Development
```bash
# Start the development server
npm run dev

# Open database viewer (optional)
npx prisma studio
```

Navigate to:
- **Application**: http://localhost:3000
- **Database Studio**: http://localhost:5555


## 🛠️ Development Workflow

### Project Structure
```
secux-cyber-athena/
├── app/                  # Next.js 15 app directory (App Router)
│   ├── api/              # Backend API routes
│   │   ├── fido/         # FIDO2 WebAuthn endpoints
│   │   ├── hsmwallet/    # HSM wallet operations
│   │   ├── transaction/  # Transaction management
│   │   └── user/         # User & authentication
│   ├── components/       # React components
│   │   ├── common/       # Shared UI components
│   │   ├── feature/      # Feature-specific components
│   │   │   ├── dashboard/# Dashboard & analytics
│   │   │   ├── fido/     # FIDO2 authentication
│   │   │   └── wallet/   # Wallet management
│   │   ├── form/         # Form components
│   │   ├── layout/       # Layout components
│   │   ├── modals/       # Modal dialogs
│   │   └── ui/           # Base UI components
│   ├── create-wallet/    # Wallet creation page
│   ├── dashboard/        # Main dashboard page
│   ├── api-doc/          # Swagger API documentation
│   └── globals.css       # Global styles
├── lib/                  # Core business logic & utilities
│   ├── api/              # API client & Swagger config
│   ├── btc-multisig/     # Bitcoin multi-signature operations
│   ├── db/               # Database connection (Prisma)
│   ├── feature/          # Feature-specific logic
│   │   ├── fido/         # FIDO2 operations & helpers
│   │   ├── hsm/          # HSM connection management
│   │   └── participant/  # Participant validation
│   ├── middleware/       # API middleware (auth, CORS, security)
│   └── utils/            # Utility functions
│       ├── error-handler.ts    # Centralized error handling
│       ├── field-encryption.ts # Field-level encryption
│       ├── form-validation.ts  # Form validation schemas
│       ├── input-validation.ts # API input validation
│       ├── rate-limiter.ts     # Rate limiting
│       └── secure-storage.ts   # Secure client storage
├── prisma/               # Database schema & migrations
│   └── schema.prisma     # Prisma database models
├── config/               # Application configuration
│   └── index.ts          # Centralized constants & limits
├── tests/                # API testing files
└── public/               # Static assets (images, icons)
```

### Key Components

#### Frontend Components
- **`Dashboard.tsx`** (`app/components/feature/dashboard/`) - Main user interface with portfolio analytics, balance views, and transaction management
- **`CreateWallet.tsx`** (`app/components/feature/wallet/`) - Multi-signature wallet creation interface with HSM integration
- **`FidoHandler.tsx`** (`app/components/feature/fido/`) - FIDO2 WebAuthn registration and authentication flows
- **`PendingTransactions.tsx`** (`app/components/feature/wallet/`) - Transaction approval interface with multi-signature workflow
- **`TransactionHistory.tsx`** (`app/components/feature/wallet/`) - Historical transaction viewer with filtering and pagination
- **`CosignerForm.tsx`** (`app/components/form/`) - Reusable form component for cosigner management and validation

#### API Endpoints
- **`/api/hsmwallet/create-wallet`** - Multi-signature wallet creation with HSM key derivation
- **`/api/hsmwallet/initiate-transaction`** - Transaction initiation with multi-signature approval workflow
- **`/api/fido/register`** & **`/api/fido/authenticate`** - FIDO2 WebAuthn registration and authentication
- **`/api/transaction/[id]`** - Transaction approval and status management
- **`/api/user/multisig-wallet`** - User wallet management and participant operations

#### Core Libraries
- **`lib/btc-multisig/`** - Bitcoin multi-signature wallet operations, transaction creation, and key management
- **`lib/feature/fido/fido-helpers.ts`** - FIDO2 WebAuthn helper functions with comprehensive error handling
- **`lib/feature/hsm/hsm-connection.ts`** - Unified HSM connection management for secure key operations
- **`lib/middleware/middleware.ts`** - JWT authentication, CORS, and request validation middleware
- **`lib/utils/rate-limiter.ts`** - IP-based rate limiting for API protection against DoS attacks

### Available Scripts
```bash
npm run dev        # Start development server with Turbopack
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run patch      # Apply patches (patch-package)
```

## 🔐 Security Features Explained

### Hardware Security Module (HSM) Integration
- **PUF Technology**: Physical Unclonable Functions ensure unique device fingerprints
- **Secure Key Storage**: Private keys never leave the HSM environment
- **Hardware-Backed Signing**: All transaction signatures generated within tamper-resistant hardware
- **Key Derivation**: Deterministic key generation using user passphrases and HSM salt
- **Remote HSM Access**: Secure communication with external HSM vaults via encrypted channels

### Multi-Signature Wallet Architecture
- **M-of-N Governance**: Configurable threshold signatures (e.g., 2-of-3, 3-of-5)
- **Independent Key Generation**: Each participant's keys derived separately through HSM
- **Transaction Approval Workflow**: Multi-step approval process with participant validation
- **Audit Trail**: Complete transaction history with approval status and timestamps
- **Secure Address Generation**: P2SH (Pay-to-Script-Hash) addresses for Bitcoin multi-signature

### FIDO2 WebAuthn Authentication
- **Passwordless Authentication**: Hardware-backed biometric or PIN authentication
- **Hardware Binding**: Credentials cryptographically tied to specific authenticator devices
- **Phishing Resistance**: Origin validation and challenge-response prevents credential theft
- **Public Key Cryptography**: Asymmetric encryption ensures credentials never travel over network
- **Device Roaming**: Support for cross-platform authenticators with proper credential management

### Comprehensive Input Validation
- **Frontend Validation**: Real-time validation with `lib/form-validation.ts` using Zod schemas
- **API Input Validation**: Server-side validation for all endpoints with `lib/utils/input-validation.ts`
- **Type Safety**: Full TypeScript coverage ensures compile-time data integrity
- **Sanitization**: Input sanitization prevents XSS and injection attacks
- **Business Logic Validation**: Domain-specific validation (Bitcoin addresses, amounts, etc.)

### Multi-Layer Rate Limiting
- **IP-based Protection**: `lib/utils/rate-limiter.ts` prevents brute force and DoS attacks
- **Endpoint-Specific Limits**: Different rate limits for sensitive operations (auth, transactions)
- **Sliding Window**: Time-based rate limiting with configurable windows and thresholds
- **Memory-based Storage**: Development-friendly rate limiting with optional Redis scaling

### API Security Architecture
- **JWT Authentication**: Stateless token-based authentication with configurable expiration
- **CORS Protection**: Strict origin validation with whitelist-based access control
- **Security Headers**: Comprehensive security headers via `lib/middleware/security-headers.ts`
- **Error Handling**: Unified error handling that prevents information leakage
- **Request Validation**: Zod-based schema validation for all API inputs

### Database Security
- **Field-Level Encryption**: Sensitive data encrypted using `lib/utils/field-encryption.ts`
- **Secure Storage**: Client-side secure storage with `lib/utils/secure-storage.ts`
- **Data Integrity**: Prisma ORM with type-safe database operations
- **Access Control**: Role-based access control through participant validation
- **Audit Logging**: Complete audit trail for all user actions and system events

## 🤝 Contributing

We welcome contributions from the community! This project is designed to be educational, so contributions that improve learning value are especially appreciated.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with clear, educational comments
4. Test your changes thoroughly
5. Commit with descriptive messages (`git commit -m 'feat: add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Contribution Guidelines
- **Educational Value**: Ensure changes improve learning opportunities
- **Security First**: All changes must maintain or improve security
- **Code Quality**: Follow TypeScript and ESLint standards
- **Documentation**: Update relevant documentation
- **Testing**: Verify functionality works as expected

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

Security is our top priority. If you discover a security vulnerability, please review our [Security Policy](SECURITY.md) for responsible disclosure guidelines.

**Do not report security issues in public GitHub issues.**

## 🙏 Acknowledgments

- **SecuX Technology** - Hardware security expertise and HSM integration
- **WebAuthn/FIDO2** - Standards for passwordless authentication
- **Open Source Community** - Libraries and tools that make this project possible

## 📞 Support & Community

- **Demo**: [cyber-athena.vercel.app](https://cyber-athena.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/secuxtech/SecuX-Cyber-Athena/issues)
- **Discussions**: [GitHub Discussions](https://github.com/secuxtech/SecuX-Cyber-Athena/discussions)
