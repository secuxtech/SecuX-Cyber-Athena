/**
 * FIDO Helper Functions
 *
 * This module abstracts and simplifies FIDO WebAuthn operations, providing:
 * 1. Code reuse - Centralize common FIDO registration and authentication patterns
 * 2. Error handling - Unified error handling for WebAuthn operations
 * 3. Type safety - Properly typed interfaces for FIDO operations
 * 4. Validation - Input validation and format checking
 *
 * Design principles:
 * - Simplify complex WebAuthn workflows into clear functions
 * - Provide consistent error handling across FIDO operations
 * - Maintain security best practices for credential operations
 * - Support both registration and authentication flows
 */

import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import {
  createFidoRegisterOptions,
  fidoRegister,
  createFidoAuthenticateOptions,
  fidoAuthenticate,
} from "@/lib/api/api-client";

/**
 * Input validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * FIDO registration result interface
 */
export interface FidoRegistrationResult {
  success: boolean;
  message: string;
  error?: Error;
}

/**
 * FIDO authentication result interface
 */
export interface FidoAuthenticationResult {
  success: boolean;
  message: string;
  token?: string;
  isNewUser?: boolean;
  error?: Error;
}

/**
 * WebAuthn options interface
 */
export interface WebAuthnOptions {
  challenge: string;
  rp?: any;
  user?: any;
  pubKeyCredParams?: any;
  [key: string]: any;
}

/**
 * Validate and sanitize input fields for FIDO operations
 *
 * Features:
 * 1. Input sanitization - Remove whitespace and validate format
 * 2. Required field validation - Ensure all necessary fields are present
 * 3. Consistent error messages - Provide clear validation feedback
 *
 * @param accountId - User account identifier
 * @param service - Service name (optional for registration)
 * @param isAuthentication - Whether this is for authentication (requires service)
 * @returns Validation result with sanitized values
 */
export function validateFidoInputs(
  accountId: string,
  service?: string,
  isAuthentication: boolean = false,
): ValidationResult & { accountId?: string; service?: string } {
  // Sanitize inputs by trimming whitespace
  const sanitizedAccountId = accountId?.trim();
  const sanitizedService = service?.trim();

  // Validate required fields
  if (!sanitizedAccountId) {
    return {
      isValid: false,
      message: "Please enter account ID.",
    };
  }

  if (isAuthentication && !sanitizedService) {
    return {
      isValid: false,
      message: "Please select a service.",
    };
  }

  // Check service availability (temporary restriction)
  if (isAuthentication && sanitizedService !== "MultiSig Vault") {
    return {
      isValid: false,
      message: "This service is under construction.",
    };
  }

  return {
    isValid: true,
    accountId: sanitizedAccountId,
    service: sanitizedService,
  };
}

/**
 * Validate and process WebAuthn options from API response
 *
 * Features:
 * 1. Response normalization - Handle different API response formats
 * 2. Challenge validation - Ensure WebAuthn challenge is present
 * 3. Options preparation - Prepare options for WebAuthn client
 *
 * @param apiResponse - Response from FIDO options API
 * @returns Processed WebAuthn options
 * @throws Error when options are invalid or challenge is missing
 */
export function processWebAuthnOptions(apiResponse: any): WebAuthnOptions {
  // Normalize response format - handle both direct and nested responses
  const raw = apiResponse.data?.requestOptions || apiResponse.data || apiResponse;
  const optionsJSON = { ...raw };

  // Validate challenge presence
  if (!optionsJSON.challenge) {
    throw new Error("Invalid WebAuthn challenge - server response missing challenge");
  }

  return optionsJSON;
}

/**
 * Execute FIDO registration flow
 *
 * Features:
 * 1. Complete registration workflow - From options request to verification
 * 2. Error handling - Comprehensive error catching and formatting
 * 3. Validation - Input validation and security checks
 * 4. Type safety - Properly typed responses
 *
 * This function encapsulates the entire FIDO registration process:
 * 1. Validate inputs
 * 2. Request registration options from server
 * 3. Process WebAuthn options
 * 4. Start client-side registration
 * 5. Send credential to server for verification
 *
 * @param accountId - User account identifier
 * @param service - Service name
 * @returns Registration result with success status and message
 */
export async function executeFidoRegistration(
  accountId: string,
  service: string,
): Promise<FidoRegistrationResult> {
  try {
    // Step 1: Validate inputs
    const validation = validateFidoInputs(accountId, service, false);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message!,
      };
    }

    // Step 2: Request registration options from server
    const optionsResponse = await createFidoRegisterOptions({
      accountId: validation.accountId!,
    });

    // Step 3: Process and validate WebAuthn options
    const optionsJSON = processWebAuthnOptions(optionsResponse);

    // Step 4: Start client-side WebAuthn registration
    const credential = await startRegistration({ optionsJSON } as any);

    // Step 5: Send credential to server for verification
    const verifyResponse = await fidoRegister({
      accountId: validation.accountId!,
      credential,
    });

    // Step 6: Validate verification result
    if (!verifyResponse.data?.verified) {
      throw new Error("Server verification failed - credential not accepted");
    }

    return {
      success: true,
      message: "Registration completed successfully.",
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Registration failed: ${error.message || "Unknown error"}`,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Execute FIDO authentication flow
 *
 * Features:
 * 1. Complete authentication workflow - From options request to token storage
 * 2. Token management - Secure token storage using secureStorage
 * 3. Navigation logic - Determine next page based on user status
 * 4. Error handling - Comprehensive error catching and formatting
 *
 * This function encapsulates the entire FIDO authentication process:
 * 1. Validate inputs
 * 2. Request authentication options from server
 * 3. Process WebAuthn options
 * 4. Start client-side authentication
 * 5. Send assertion to server for verification
 * 6. Store authentication token securely
 * 7. Return user status for navigation
 *
 * @param accountId - User account identifier
 * @param service - Service name
 * @returns Authentication result with success status, token, and user info
 */
export async function executeFidoAuthentication(
  accountId: string,
  service: string,
): Promise<FidoAuthenticationResult> {
  try {
    // Step 1: Validate inputs
    const validation = validateFidoInputs(accountId, service, true);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message!,
      };
    }

    // Step 2: Request authentication options from server
    const optionsResponse = await createFidoAuthenticateOptions({
      accountId: validation.accountId!,
    });

    // Step 3: Process and validate WebAuthn options
    const optionsJSON = processWebAuthnOptions(optionsResponse);

    // Step 4: Start client-side WebAuthn authentication
    const credential = await startAuthentication({ optionsJSON } as any);

    // Step 5: Send assertion to server for verification
    const verifyResponse = await fidoAuthenticate({
      accountId: validation.accountId!,
      credential,
      service: validation.service!,
    });

    // Step 6: Validate verification result
    if (!verifyResponse.data?.verified) {
      throw new Error("Server verification failed - authentication not accepted");
    }

    // Step 7: Store authentication token securely
    const { secureStorage } = await import("@/lib/utils/secure-storage");
    await secureStorage.setToken(verifyResponse.data.token);

    return {
      success: true,
      message: "Authentication completed successfully.",
      token: verifyResponse.data.token,
      isNewUser: verifyResponse.data.isNewUser,
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Authentication failed: ${error.message || "Unknown error"}`,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Demo account cycling utility
 *
 * Features:
 * 1. Development helper - Cycle through predefined demo accounts
 * 2. Consistent behavior - Same cycling logic for both registration and authentication
 * 3. Service setup - Automatically sets appropriate service
 *
 * @param currentAccountId - Current account ID value
 * @returns Next demo account ID in the cycle
 */
export function cycleDemoAccount(currentAccountId: string): { accountId: string; service: string } {
  let nextAccountId: string;

  if (currentAccountId === "alison") {
    nextAccountId = "jeff";
  } else if (currentAccountId === "jeff") {
    nextAccountId = "jacky";
  } else {
    nextAccountId = "alison";
  }

  return {
    accountId: nextAccountId,
    service: "MultiSig Vault",
  };
}

/**
 * Usage example: How to use these FIDO helper functions in components
 *
 * // Previous duplicated registration code:
 * const handleRegistration = async () => {
 *   setIsRegistering(true);
 *   try {
 *     // Input validation...
 *     // API calls...
 *     // WebAuthn operations...
 *     // Error handling...
 *   } catch (error) {
 *     // Error formatting...
 *   } finally {
 *     setIsRegistering(false);
 *   }
 * };
 *
 * // Current simplified code:
 * const handleRegistration = async () => {
 *   setIsRegistering(true);
 *   try {
 *     const result = await executeFidoRegistration(accountId, service);
 *     setMessage(result.message);
 *   } finally {
 *     setIsRegistering(false);
 *   }
 * };
 *
 * Benefits of this extraction:
 * 1. Code reuse - Multiple components can use the same FIDO logic
 * 2. Consistency - Ensure all FIDO operations follow the same patterns
 * 3. Maintainability - FIDO logic changes only need to be made in one place
 * 4. Testability - Can independently test each FIDO function
 * 5. Readability - Component code becomes more focused on UI logic
 */