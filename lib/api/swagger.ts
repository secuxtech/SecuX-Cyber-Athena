import swaggerJSDoc from "swagger-jsdoc";

const TransactionObject = {
  type: "object",
  properties: {
    id: {
      type: "integer",
      description: "Auto-incremented database ID",
    },
    initiatorId: {
      type: "string",
      description: "Account ID of the transaction initiator",
    },
    operation: {
      type: "string",
      enum: ["TRANSFER"],
      description: "Transaction operation type",
    },
    asset: {
      type: "string",
      enum: ["BTC"],
      description: "Cryptocurrency asset type",
    },
    amount: {
      type: "string",
      description: "Transaction amount in BTC (Decimal type stored as string)",
      pattern: "^\\d+(\\.\\d{1,8})?$",
    },
    recipient: {
      type: "string",
      description: "Bitcoin address receiving the funds",
    },
    status: {
      type: "string",
      enum: ["PENDING", "COMPLETED", "CANCELLED", "FAILED"],
      description: "Current transaction status",
    },
    approvalCount: {
      type: "integer",
      description: "Number of approvals received",
      minimum: 0,
    },
    requiredCount: {
      type: "integer",
      description: "Number of approvals required",
      minimum: 1,
    },
    transactionId: {
      type: "string",
      nullable: true,
      description: "HSM transaction identifier (nullable)",
    },
    transactionHash: {
      type: "string",
      nullable: true,
      description: "Bitcoin transaction hash once broadcasted (nullable)",
    },
    hsmVault: {
      type: "string",
      format: "uri",
      description: "HSM Vault endpoint URL",
    },
    walletId: {
      type: "string",
      description: "Multi-signature wallet identifier",
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Transaction creation timestamp",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      description: "Last update timestamp",
    },
  },
  example: {
    id: 123,
    initiatorId: "alice123",
    operation: "TRANSFER",
    asset: "BTC",
    amount: "0.001",
    recipient: "2N1234567890abcdef...",
    status: "PENDING",
    approvalCount: 1,
    requiredCount: 3,
    transactionId: "hsm_tx_abc123",
    transactionHash: null,
    hsmVault: "https://hsm.example.com/vault",
    walletId: "mswallet_def456",
    createdAt: "2024-01-01T12:00:00.000Z",
    updatedAt: "2024-01-01T12:00:00.000Z",
  },
};

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SecuX Cyber Athena API Documentation",
      version: "1.0.0",
      description: `
# SecuX Cyber Athena API

**Enterprise-grade Bitcoin multi-signature wallet with hardware security and FIDO2 authentication**

This API provides secure Bitcoin wallet management with the following features:
- **Multi-signature Bitcoin wallets** with M-of-N governance
- **FIDO2/WebAuthn authentication** for passwordless security
- **Hardware Security Module (HSM)** integration for key protection
- **Rate limiting and security headers** for API protection
- **Comprehensive transaction management** with audit trails

## Security Model
All wallet operations require authenticated users and HSM-backed signatures.
FIDO2 endpoints are public but rate-limited. Transaction endpoints require JWT authentication.

## Base URL
- **Development**: \`http://localhost:3000\`
- **Production**: \`https://cyber-athena.vercel.app\`
      `,
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
      contact: {
        name: "SecuX Cyber Athena",
        url: "https://github.com/secuxtech/SecuX-Cyber-Athena",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://cyber-athena.vercel.app",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "HSM Wallet",
      },
      {
        name: "Transactions",
      },
      {
        name: "Approvals",
      },
      {
        name: "User",
      },
      {
        name: "Fido",
      },
    ],
    paths: {
      "/api/transaction": {
        get: {
          tags: ["Transactions"],
          summary: "Get all transactions",
          description: "Returns all transactions for the given accountId.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "accountId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Account ID",
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["PENDING", "COMPLETED", "CANCELLED", "FAILED"] },
              description: "Filter transactions by status.",
            },
          ],
          responses: {
            "200": {
              description: "Transaction list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: TransactionObject,
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Transactions"],
          summary: "Create a transaction",
          description: "Creates a new transaction.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "initiatorId", "asset", "amount", "recipient",
                    "approvalCount", "requiredCount", "transactionId", "hsmVault", "walletId",
                  ],
                  properties: {
                    initiatorId: { type: "string", description: "Account ID of the initiator" },
                    asset: { type: "string", enum: ["BTC"], description: "Asset type" },
                    amount: { type: "number", description: "Transaction amount" },
                    recipient: { type: "string", description: "Recipient address" },
                    approvalCount: { type: "integer", description: "Current approval count" },
                    requiredCount: { type: "integer", description: "Required approval count" },
                    transactionId: { type: "string", description: "Transaction ID in HSM" },
                    hsmVault: { type: "string", description: "HSM Vault URL" },
                    walletId: { type: "string", description: "Multi-signature wallet ID" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Transaction created",
              content: {
                "application/json": {
                  schema: TransactionObject,
                },
              },
            },
          },
        },
      },
      "/api/transaction/{id}": {
        get: {
          tags: ["Transactions"],
          summary: "Get a transaction",
          description: "Returns a transaction by ID (SN)",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Transaction ID (SN)",
            },
          ],
          responses: {
            "200": {
              description: "Transaction found",
              content: {
                "application/json": {
                  schema: TransactionObject,
                },
              },
            },
          },
        },
      },
      "/api/transaction/history": {
        get: {
          tags: ["Transactions"],
          summary: "Get transaction history",
          description: "Returns transaction history except pending transactions",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "Transaction history",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: TransactionObject,
                  },
                },
              },
            },
          },
        },
      },
      "/api/approval/{id}": {
        get: {
          tags: ["Approvals"],
          summary: "Get transaction approvals by transaction ID (SN)",
          description: "Returns all approvals for a given transaction ID (SN).",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Transaction ID (SN)",
            },
          ],
          responses: {
            "200": {
              description: "List of approvals for the transaction",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "integer", description: "Approval ID" },
                        txSN: { type: "integer", description: "Transaction SN" },
                        approverId: { type: "string", description: "Approver account ID" },
                        status: { type: "string", description: "Approval status" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid transaction ID (SN)" },
            "500": { description: "Internal Server Error" },
          },
        },
      },
      "/api/approval": {
        get: {
          tags: ["Approvals"],
          summary: "Get all approval records",
          description: "Returns all approval records, including related transaction info.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "List of approval records",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "integer", description: "Approval ID" },
                        txSN: { type: "integer", description: "Transaction SN" },
                        approverId: { type: "string", description: "Approver account ID" },
                        status: { type: "string", description: "Approval status" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                        transaction: {
                          type: "object",
                          properties: {
                            id: { type: "integer" },
                            initiatorId: { type: "string" },
                            operation: { type: "string" },
                            asset: { type: "string" },
                            amount: { type: "string" },
                            recipient: { type: "string" },
                            status: { type: "string" },
                            approvalCount: { type: "integer" },
                            requiredCount: { type: "integer" },
                            transactionId: { type: "string" },
                            transactionHash: { type: "string" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "500": { description: "Internal Server Error" },
          },
        },
      },
      "/api/hsmwallet/create-wallet": {
        post: {
          tags: ["HSM Wallet"],
          summary: "Create a Bitcoin multi-signature wallet",
          description: `
**Creates a new M-of-N multi-signature Bitcoin wallet with HSM-backed security**

This endpoint orchestrates the complex process of creating a secure multi-signature Bitcoin wallet:

1. **Validates all participants** - Ensures each cosigner has valid HSM credentials
2. **Retrieves public keys** - Fetches Bitcoin public keys from HSM for each participant
3. **Generates Bitcoin address** - Creates multi-signature script and corresponding address
4. **Stores wallet metadata** - Persists governance and transaction management data

**Multi-Signature Concepts:**
- **M-of-N scheme**: Requires M signatures out of N total participants
- **This project uses 3-of-3**: All three cosigners must approve transactions
- **HSM Integration**: Private keys never leave hardware security modules
- **Deterministic**: Same public keys always generate same wallet address

**Security Features:**
- All participants validated via HSM before wallet creation
- Prevents duplicate public keys
- Comprehensive audit trail
- Rate limiting and authentication required
          `,
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["m", "n", "participants", "hsmVault"],
                  properties: {
                    m: {
                      type: "integer",
                      description: "Required number of signatures (threshold)",
                      minimum: 1,
                      maximum: 3,
                      example: 3,
                    },
                    n: {
                      type: "integer",
                      description: "Total number of participants",
                      minimum: 1,
                      maximum: 3,
                      example: 3,
                    },
                    name: {
                      type: "string",
                      description: "Human-readable wallet name",
                      minLength: 1,
                      maxLength: 100,
                      example: "Enterprise Treasury Wallet",
                    },
                    participants: {
                      type: "array",
                      description: "Array of cosigner details with credentials",
                      minItems: 1,
                      maxItems: 3,
                      items: {
                        type: "object",
                        required: ["userId", "passphraseHash"],
                        properties: {
                          userId: {
                            type: "string",
                            description: "User account identifier",
                            minLength: 3,
                            maxLength: 50,
                            example: "alice123",
                          },
                          passphraseHash: {
                            type: "string",
                            description: "SHA-256 hash of user's passphrase (64-char hex string)",
                            pattern: "^[a-f0-9]{64}$",
                            example: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                          },
                        },
                      },
                    },
                    hsmVault: {
                      type: "string",
                      format: "uri",
                      description: "HSM Vault endpoint URL",
                      example: "https://hsm.example.com/vault",
                    },
                  },
                  example: {
                    m: 3,
                    n: 3,
                    name: "Enterprise Treasury Wallet",
                    participants: [
                      {
                        userId: "alice123",
                        passphraseHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                      },
                      {
                        userId: "bob456",
                        passphraseHash: "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
                      },
                      {
                        userId: "charlie789",
                        passphraseHash: "c7fb1d3e8b1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7",
                      },
                    ],
                    hsmVault: "https://hsm.example.com/vault",
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Multi-signature wallet created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      walletId: {
                        type: "string",
                        description: "Unique wallet identifier (deterministic from public keys)",
                      },
                      address: {
                        type: "string",
                        description: "Bitcoin address for receiving funds",
                      },
                      redeemScript: {
                        type: "string",
                        description: "Hex-encoded Bitcoin script for spending transactions",
                      },
                      m: {
                        type: "integer",
                        description: "Required signatures threshold",
                      },
                      n: {
                        type: "integer",
                        description: "Total participants",
                      },
                      name: {
                        type: "string",
                        description: "Wallet display name",
                      },
                      creationTime: {
                        type: "string",
                        format: "date-time",
                        description: "Wallet creation timestamp",
                      },
                    },
                    example: {
                      walletId: "mswallet_abc123def456",
                      address: "2N1234567890abcdef...",
                      redeemScript: "5321033f4...",
                      m: 3,
                      n: 3,
                      name: "Enterprise Treasury Wallet",
                      creationTime: "2024-01-01T12:00:00.000Z",
                    },
                  },
                },
              },
            },
            "400": {
              description: "Bad request - Invalid parameters or HSM validation failed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized - Invalid or missing JWT token" },
            "403": { description: "Forbidden - HSM credential validation failed" },
            "409": { description: "Conflict - Wallet already exists with same key combination" },
            "429": { description: "Rate limit exceeded" },
            "500": { description: "Internal server error - HSM or database failure" },
          },
        },
      },
      "/api/hsmwallet/btc/balance/{accountId}": {
        get: {
          tags: ["HSM Wallet"],
          summary: "Get BTC balance list",
          description: "Returns the BTC balance list for all wallets of the account.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "accountId",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Account ID",
            },
          ],
          responses: {
            "200": {
              description: "BTC balance list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      balanceList: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            walletId: { type: "string", description: "Multi-signature wallet identifier" },
                            address: { type: "string", description: "Bitcoin wallet address", example: "3MsE8Jfjkh6QqvCXjxLeWu2JKjePqNX1aY" },
                            balance: { type: "number", description: "Current confirmed balance in BTC", example: 0.12345678 },
                            name: { type: "string", description: "Human-readable wallet name" },
                            participants: { type: "array", items: { type: "string" }, description: "Array of participant user IDs" },
                            creationTime: { type: "string", format: "date-time", description: "Wallet creation timestamp" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/hsmwallet/query-transactions/{accountId}": {
        get: {
          tags: ["HSM Wallet"],
          summary: "Get all transactions for accountId",
          description: "Returns all transaction records or pending transactions for all wallets of the account.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "accountId",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Account ID",
            },
            {
              name: "status",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["PENDING", "COMPLETED", "FAILED"],
                description: "Filter transactions by status",
              },
              example: "PENDING",
            },
            {
              name: "page",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
                description: "Page number for pagination (defaults to 1)",
              },
              example: 1,
            },
          ],
          responses: {
            "200": {
              description: "Transaction records or pending transactions list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        hsmVault: { type: "string", description: "HSM Vault URL" },
                        walletId: { type: "string", description: "Wallet ID" },
                        response: { type: "object", description: "Raw response from HSM service" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/hsmwallet/initiate-transaction": {
        post: {
          tags: ["HSM Wallet"],
          summary: "Initiate a transaction",
          description: "Initiates a new transaction",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["initiatorId", "operation", "asset", "amount", "recipient", "hsmVault", "walletId", "walletSN", "passphraseHash"],
                  properties: {
                    initiatorId: {
                      type: "string",
                      description: "Account ID of the transaction initiator",
                      example: "alice123",
                    },
                    operation: {
                      type: "string",
                      description: "Operation type description",
                      example: "TRANSFER",
                    },
                    asset: {
                      type: "string",
                      enum: ["BTC"],
                      description: "Cryptocurrency asset type",
                    },
                    amount: {
                      type: "number",
                      description: "Amount in BTC (will be converted to satoshis internally)",
                      minimum: 0.00000001,
                      example: 0.001,
                    },
                    recipient: {
                      type: "string",
                      description: "Bitcoin address to send funds to",
                      example: "2N1234567890abcdef...",
                    },
                    hsmVault: {
                      type: "string",
                      format: "uri",
                      description: "HSM Vault endpoint URL",
                    },
                    walletId: {
                      type: "string",
                      description: "Multi-signature wallet identifier",
                    },
                    walletSN: {
                      type: "integer",
                      minimum: 1,
                      description: "Wallet serial number in database",
                    },
                    passphraseHash: {
                      type: "string",
                      pattern: "^[a-f0-9]{64}$",
                      description: "SHA-256 hash of user's passphrase (64-char hex string)",
                    },
                    feeRate: {
                      type: "integer",
                      minimum: 1,
                      maximum: 10000,
                      description: "Bitcoin fee rate in sat/vB (optional, defaults to 1000)",
                      default: 1000,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Transaction initiated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      transactionId: { type: "string" },
                      walletId: { type: "string" },
                      recipientAddress: { type: "string" },
                      amount: { type: "number" },
                      status: { type: "string" },
                      psbt: { type: "string" },
                      inputCount: { type: "number" },
                      requiredSignatures: { type: "number" },
                      signatures: { type: "object" },
                      signaturesReceived: { type: "number" },
                      initiatedTime: { type: "string", format: "date-time" },
                      note: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/hsmwallet/transaction-status/{id}/{initiatorId}": {
        get: {
          tags: ["HSM Wallet"],
          summary: "Get transaction status",
          description: "Returns the status of a transaction",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "integer",
                minimum: 1,
                description: "Database transaction ID (numeric)",
              },
              example: 123,
            },
            {
              name: "initiatorId",
              in: "path",
              required: true,
              schema: {
                type: "string",
                minLength: 1,
                maxLength: 100,
                description: "Transaction initiator account ID",
              },
              example: "alice123",
            },
          ],
          responses: {
            "200": {
              description: "Transaction status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      response: {
                        type: "object",
                        description: "Transaction status response from HSM wallet library",
                        additionalProperties: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/hsmwallet/submit-signature": {
        post: {
          tags: ["HSM Wallet"],
          summary: "Submit a signature",
          description: "Submits a signature for a transaction. All fields are required.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "initiatorId", "approverId", "hsmVault", "walletId", "passphraseHash"],
                  properties: {
                    id: { type: "integer", description: "Transaction database ID (SN)" },
                    initiatorId: { type: "string", description: "Initiator account ID" },
                    approverId: { type: "string", description: "Approver account ID who is signing" },
                    hsmVault: { type: "string", description: "HSM Vault URL" },
                    walletId: { type: "string", description: "Multi-signature wallet ID" },
                    passphraseHash: {
                      type: "string",
                      pattern: "^[a-f0-9]{64}$",
                      description: "SHA-256 hash of approver's passphrase (64-char hex string)",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Signature submitted",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      {
                        title: "submitResponse",
                        type: "object",
                        properties: {
                          transactionId: { type: "string" },
                          status: { type: "string" },
                          signaturesReceived: { type: "number" },
                          requiredSignatures: { type: "number" },
                        },
                      },
                      {
                        title: "broadcastResponse",
                        type: "object",
                        properties: {
                          broadcastResult: {
                            type: "object",
                            properties: {
                              transactionId: { type: "string" },
                              status: { type: "string" },
                              txHash: { type: "string" },
                              broadcastTime: { type: "string", format: "date-time" },
                              message: { type: "string" },
                            },
                          },
                          balanceAfter: {
                            type: "object",
                            properties: {
                              walletId: { type: "string" },
                              address: { type: "string" },
                              confirmedBalance: { type: "number" },
                            },
                          },
                        },
                      },
                    ],
                  },
                  examples: {
                    approvalInProgress: {
                      summary: "Transaction is waiting for approval",
                      value: {
                        transactionId: "string",
                        status: "string",
                        signaturesReceived: 0,
                        requiredSignatures: 0,
                      },
                    },
                    transactionBroadcasted: {
                      summary: "Transaction is broadcasted",
                      value: {
                        broadcastResult: {
                          transactionId: "string",
                          status: "string",
                          txHash: "string",
                          broadcastTime: new Date().toISOString(),
                          message: "string",
                        },
                        balanceAfter: {
                          walletId: "string",
                          address: "string",
                          confirmedBalance: 0,
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields or mismatch" },
            "404": { description: "Multisig participant not found" },
            "500": { description: "Failed to submit signature" },
          },
        },
      },
      "/api/hsmwallet/cancel-transaction": {
        post: {
          tags: ["HSM Wallet"],
          summary: "Cancel a transaction",
          description: "Cancels a transaction. All fields are required.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "initiatorId", "transactionId", "hsmVault"],
                  properties: {
                    id: { type: "string", description: "Transaction database ID (SN)" },
                    initiatorId: { type: "string", description: "Initiator account ID" },
                    transactionId: { type: "string", description: "Transaction ID in HSM" },
                    hsmVault: { type: "string", description: "HSM Vault URL" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Transaction cancelled",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields or mismatch" },
            "404": { description: "Multisig participant or wallet not found" },
            "500": { description: "Failed to cancel transaction" },
          },
        },
      },
      "/api/hsmwallet/utils": {
        get: {
          tags: ["HSM Wallet"],
          summary: "HSM wallet utilities",
          description:
            "Provides various utilities for HSM wallet operations including health checks, fee rate recommendations, " +
            "transaction size estimation, and testnet faucet.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "action",
              in: "query",
              required: true,
              schema: {
                type: "string",
                enum: ["health", "fee-rates", "estimate-vsize", "faucet"],
              },
              description: "The utility action to perform",
              examples: {
                health: {
                  summary: "Health check",
                  value: "health",
                },
                feeRates: {
                  summary: "Get fee rate recommendations",
                  value: "fee-rates",
                },
                estimateVsize: {
                  summary: "Estimate transaction virtual size",
                  value: "estimate-vsize",
                },
                faucet: {
                  summary: "Request testnet Bitcoin from faucet",
                  value: "faucet",
                },
              },
            },
            {
              name: "walletId",
              in: "query",
              schema: { type: "string" },
              description: "Required for 'estimate-vsize' and 'faucet' actions",
            },
            {
              name: "recipientAddress",
              in: "query",
              schema: { type: "string" },
              description: "Required for 'estimate-vsize' action - Bitcoin address to estimate transaction size for",
            },
          ],
          responses: {
            "200": {
              description: "Utility response varies by action",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      {
                        title: "Health Check Response",
                        type: "object",
                        properties: {
                          status: { type: "string", enum: ["healthy", "degraded"] },
                          services: {
                            type: "object",
                            properties: {
                              bitcoin: { type: "boolean" },
                              hsm: { type: "boolean" },
                            },
                          },
                          uptime: { type: "number" },
                          timestamp: { type: "string", format: "date-time" },
                        },
                      },
                      {
                        title: "Fee Rates Response",
                        type: "object",
                        properties: {
                          fastestFee: { type: "number", description: "Sat/vB for fastest confirmation" },
                          halfHourFee: { type: "number", description: "Sat/vB for ~30 min confirmation" },
                          hourFee: { type: "number", description: "Sat/vB for ~1 hour confirmation" },
                          economyFee: { type: "number", description: "Sat/vB for economy confirmation" },
                          minimumFee: { type: "number", description: "Minimum network fee" },
                        },
                      },
                      {
                        title: "Virtual Size Estimate Response",
                        type: "object",
                        properties: {
                          estimatedVsize: { type: "number", description: "Estimated transaction size in virtual bytes" },
                          inputCount: { type: "number" },
                          outputCount: { type: "number" },
                          multisigType: { type: "string", example: "3-of-3" },
                        },
                      },
                      {
                        title: "Faucet Response",
                        type: "object",
                        properties: {
                          success: { type: "boolean" },
                          txHash: { type: "string", description: "Transaction hash of faucet funding" },
                          amount: { type: "number", description: "Amount sent in BTC" },
                          message: { type: "string" },
                        },
                      },
                    ],
                  },
                  examples: {
                    healthResponse: {
                      summary: "Health check response",
                      value: {
                        status: "healthy",
                        services: { bitcoin: true, hsm: true },
                        uptime: 86400,
                        timestamp: "2024-01-01T00:00:00.000Z",
                      },
                    },
                    feeRatesResponse: {
                      summary: "Fee rates response",
                      value: {
                        fastestFee: 50,
                        halfHourFee: 30,
                        hourFee: 20,
                        economyFee: 10,
                        minimumFee: 1,
                      },
                    },
                    vsizeResponse: {
                      summary: "Virtual size estimate response",
                      value: {
                        estimatedVsize: 374,
                        inputCount: 2,
                        outputCount: 2,
                        multisigType: "3-of-3",
                      },
                    },
                    faucetResponse: {
                      summary: "Faucet response",
                      value: {
                        success: true,
                        txHash: "abc123def456...",
                        amount: 0.001,
                        message: "Testnet Bitcoin sent successfully",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Bad request - missing required parameters or invalid action",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized - Invalid or missing JWT token" },
            "429": { description: "Rate limit exceeded" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/fido/register-options": {
        post: {
          tags: ["Fido"],
          summary: "Generate FIDO2/WebAuthn registration options",
          description: `
**Step 1 of FIDO2 Registration Flow**

Generates WebAuthn registration options (PublicKeyCredentialCreationOptions) that the browser
will use to create a new credential. This endpoint initiates passwordless authentication setup.

**FIDO2 Flow:**
1. Call this endpoint to get registration options
2. Browser prompts user for biometric/PIN authentication
3. Browser creates credential using Web Authentication API
4. Send credential to /api/fido/register for verification and storage

**Security Features:**
- Rate limited to prevent abuse
- Challenge-based cryptographic proof
- Origin validation for phishing resistance
- Supports both initial registration and multi-device enrollment
          `,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accountId: {
                      type: "string",
                      description: "User account identifier",
                      example: "user123",
                    },
                    appendMode: {
                      type: "boolean",
                      description: "Set to true to allow multiple credentials for same user (multi-device support)",
                      default: false,
                      example: false,
                    },
                  },
                  required: ["accountId"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "WebAuthn registration options for browser credential creation",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    description: "PublicKeyCredentialCreationOptions - passed directly to navigator.credentials.create()",
                    properties: {
                      rp: {
                        type: "object",
                        properties: {
                          name: { type: "string", example: "SecuX Cyber Athena" },
                          id: { type: "string", example: "localhost" },
                        },
                      },
                      user: {
                        type: "object",
                        properties: {
                          id: { type: "string", description: "Base64URL encoded user ID" },
                          name: { type: "string", example: "user123" },
                          displayName: { type: "string", example: "user123" },
                        },
                      },
                      challenge: { type: "string", description: "Base64URL encoded cryptographic challenge" },
                      pubKeyCredParams: {
                        type: "array",
                        description: "Supported public key algorithms",
                      },
                      timeout: { type: "number", example: 300000, description: "Timeout in milliseconds" },
                      attestation: { type: "string", enum: ["none"], example: "none" },
                    },
                  },
                  example: {
                    rp: { name: "SecuX Cyber Athena", id: "localhost" },
                    user: {
                      id: "dXNlcjEyMw",
                      name: "user123",
                      displayName: "user123",
                    },
                    challenge: "randomChallenge123",
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    timeout: 300000,
                    attestation: "none",
                  },
                },
              },
            },
            "400": {
              description: "Bad request - Invalid or missing account ID",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "403": {
              description: "Forbidden - Credential already exists (use appendMode: true for multi-device)",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string" },
                      message: { type: "string", example: "Already registered. Please login and add new device from settings." },
                    },
                  },
                },
              },
            },
            "429": { description: "Rate limit exceeded" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/fido/register": {
        post: {
          tags: ["Fido"],
          summary: "FIDO device registration",
          description: "Register WebAuthn device (PublicKeyCredential)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accountId: { type: "string" },
                    credential: { type: "object" },
                  },
                  required: ["accountId", "credential"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Registration successful" },
            "400": { description: "Missing insert data or verification failed" },
            "403": { description: "Credential already exists" },
          },
        },
      },
      "/api/fido/authenticate-options": {
        post: {
          tags: ["Fido"],
          summary: "Generate authentication options (FIDO)",
          description: "Generate WebAuthn authentication options (PublicKeyCredentialRequestOptions)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accountId: { type: "string" },
                  },
                  required: ["accountId"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "WebAuthn authentication options",
              content: {
                "application/json": {
                  schema: { type: "object" }, // PublicKeyCredentialRequestOptions
                },
              },
            },
            "400": { description: "Missing insert data or account not registered" },
          },
        },
      },
      "/api/fido/authenticate": {
        post: {
          tags: ["Fido"],
          summary: "FIDO device authentication",
          description: "Authenticate WebAuthn device (PublicKeyCredential)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accountId: { type: "string" },
                    credential: { type: "object" },
                  },
                  required: ["accountId", "credential"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Authentication successful, returns JWT or login info" },
            "400": { description: "Missing insert data or verification failed" },
          },
        },
      },
      "/api/user/{accountId}": {
        get: {
          tags: ["User"],
          summary: "Get user credential count",
          description: "Returns the accountId and the number of credentials for the user.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "accountId",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Account ID",
            },
          ],
          responses: {
            "200": {
              description: "User credential count",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      accountId: { type: "string", description: "User account ID" },
                      credentialCount: { type: "integer", description: "Number of credentials" },
                    },
                  },
                },
              },
            },
            "500": { description: "Internal Server Error" },
          },
        },
      },
      "/api/user/multisig-wallet": {
        get: {
          tags: ["User"],
          summary: "Get multisig signers count for user",
          description: "Returns the number of multisig signers for the given accountId.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "accountId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Account ID",
            },
          ],
          responses: {
            "200": {
              description: "Multisig signers count",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      multisigSignersLength: { type: "integer", description: "Number of multisig signers" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing accountId" },
            "404": { description: "User not found" },
          },
        },
      },
      "/api/user/hsm-vault": {
        get: {
          tags: ["User"],
          summary: "Get HSM vaults for user",
          description: "Returns all HSM vault and walletId pairs for the given accountId.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "accountId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Account ID",
            },
          ],
          responses: {
            "200": {
              description: "List of HSM vaults and wallet IDs",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      hsmVaults: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string", description: "Wallet SN" },
                            hsmVault: { type: "string", description: "HSM Vault URL" },
                            walletId: { type: "string", description: "Wallet ID" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing accountId" },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  apis: [],
};

const spec = swaggerJSDoc(options);

export default spec;
