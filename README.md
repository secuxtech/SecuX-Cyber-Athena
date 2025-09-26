# SecuX Cyber Athena

**Enterprise-grade Bitcoin multi-signature wallet with hardware security and FIDO2 authentication**

A comprehensive digital asset solution designed for small and medium-sized enterprises (SMEs), combining hardware security modules (HSM), passwordless authentication, and multi-signature governance to deliver institutional-level security with educational transparency.

[![Demo](https://img.shields.io/badge/🌐_Live_Demo-cyber--athena.vercel.app-blue)](https://cyber-athena.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.2-2D3748)](https://prisma.io)

## 🎯 Project Philosophy

This project follows a **"small but secure"** philosophy, prioritizing:
- **Educational Value**: Clean, well-documented code for learning blockchain and security concepts
- **Security First**: Enterprise-grade security with multi-signature governance
- **Simplicity**: Focused feature set that demonstrates core concepts effectively
- **Transparency**: Open-source approach with detailed implementation explanations

## ✨ Core Features

### 🔐 Advanced Security
- **🗝️ Hardware Security Module (HSM)** - Secure key storage with PUF technology
- **🛡️ FIDO2 Authentication** - Passwordless, phishing-resistant authentication
- **📝 Multi-Signature Governance** - Require multiple approvals for transactions
- **🔒 Zero-Trust Architecture** - Comprehensive input validation and rate limiting

### 💼 Enterprise-Ready
- **👥 Multi-User Management** - Support for multiple cosigners and roles
- **📊 Transaction Monitoring** - Real-time transaction status and audit trails
- **⚡ Rate Limiting** - Built-in API protection against abuse
- **🏢 Compliance Features** - Audit logs and governance workflows

### 🛠️ Developer Experience
- **📚 Educational Codebase** - Well-commented code with learning resources
- **🧪 Type Safety** - Full TypeScript implementation
- **🎨 Modern UI/UX** - Bootstrap-based responsive design
- **🔧 Easy Setup** - Streamlined development environment

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js API) │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • React UI      │    │ • JWT Auth      │    │ • User Data     │
│ • FIDO2 Client  │    │ • Rate Limiting │    │ • Transactions  │
│ • Form Handling │    │ • HSM Interface │    │ • Audit Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   External HSM  │
                       │   (SecuX Vault) │
                       │                 │
                       │ • Key Storage   │
                       │ • Signing       │
                       │ • Multi-sig     │
                       └─────────────────┘
```

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

### 2. Database Configuration
```bash
# Copy environment configuration
cp .env.example .env

# Configure your PostgreSQL connection in .env
# DATABASE_URL="postgresql://username:password@localhost:5432/secux_athena"
```

Edit `.env` file with your database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/secux_athena"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
JWT_SECRET="your-jwt-secret-here"
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

## 📖 Learning Guide

This project is designed as an educational resource. Here's how to explore and learn from it:

### 🎓 For Blockchain Beginners
1. **Start with the UI** - Explore the wallet creation flow at `/create-wallet`
2. **Understand Multi-sig** - See how 3 cosigners collaborate on transactions
3. **Study FIDO2** - Learn about passwordless authentication in action

### 🔧 For Developers
1. **Architecture** - Study the clean separation between frontend/backend/database
2. **Security Patterns** - Review input validation, rate limiting, and JWT handling
3. **TypeScript Usage** - See how types improve code safety and documentation
4. **Database Design** - Examine the Prisma schema for user and transaction modeling

### 🏢 For Enterprise Users
1. **Governance Workflows** - Understand how multi-signature approval works
2. **Audit Trails** - See how transactions are logged and tracked
3. **Security Controls** - Review rate limiting and input validation patterns

## 🛠️ Development Workflow

### Project Structure
```
secux-cyber-athena/
├── app/                    # Next.js 15 app directory
│   ├── api/               # Backend API routes
│   ├── components/        # React components
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   ├── api-client.ts     # Frontend API client
│   ├── form-validation.ts # Form validation utilities
│   └── rate-limiter.ts   # Rate limiting middleware
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Database model definitions
├── config/               # Application configuration
│   └── constants.ts      # Centralized constants
└── public/               # Static assets
```

### Key Components
- **`CreateWallet.tsx`** - Multi-signature wallet creation interface
- **`Dashboard.tsx`** - Main user interface with balance and transaction views
- **`CosignerForm.tsx`** - Reusable form component for cosigner management
- **`PendingTransactions.tsx`** - Transaction approval interface

### Available Scripts
```bash
npm run dev        # Start development server with Turbopack
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run patch      # Apply patches (patch-package)
```

## 🔐 Security Features Explained

### Multi-Signature Implementation
- **3-of-3 Scheme**: All three cosigners must approve transactions
- **Independent Verification**: Each cosigner validates transaction details
- **Audit Trail**: Complete transaction history with approval status

### FIDO2 Integration
- **WebAuthn API**: Browser-native authentication
- **Hardware Binding**: Credentials tied to specific devices
- **Phishing Resistance**: Origin validation prevents credential theft

### Input Validation
- **Frontend Validation**: Real-time feedback with `lib/form-validation.ts`
- **Backend Validation**: Server-side validation for all API endpoints
- **Type Safety**: TypeScript ensures data integrity

### Rate Limiting
- **API Protection**: Prevents brute force and DoS attacks
- **Configurable Limits**: Different rates for different endpoints
- **Memory-based**: Simple implementation suitable for development

## 🧪 Testing & Quality

### Code Quality
- **TypeScript**: Full type coverage for reliability
- **ESLint**: Consistent code style and error prevention
- **Prettier**: Automated code formatting

### Security Testing
- **Input Validation**: Test form validation with edge cases
- **FIDO2 Flow**: Verify authentication and registration flows
- **Multi-sig Logic**: Test transaction approval workflows

### Browser Compatibility
- **WebAuthn Support**: Requires modern browsers (Chrome 67+, Firefox 60+, Safari 14+)
- **Responsive Design**: Works on desktop and mobile devices
- **Progressive Enhancement**: Graceful fallbacks where possible

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
- **Next.js & Vercel** - Modern web development platform
- **Prisma** - Type-safe database toolkit
- **Open Source Community** - Libraries and tools that make this project possible

## 📞 Support & Community

- **Demo**: [cyber-athena.vercel.app](https://cyber-athena.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/secuxtech/SecuX-Cyber-Athena/issues)
- **Discussions**: [GitHub Discussions](https://github.com/secuxtech/SecuX-Cyber-Athena/discussions)
