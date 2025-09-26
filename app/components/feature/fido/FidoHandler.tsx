/**
 * FIDO Handler Component - FIDO2/WebAuthn authentication interface
 * Provides registration and authentication forms for passwordless login
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  executeFidoRegistration,
  executeFidoAuthentication,
  cycleDemoAccount,
} from "@/lib/feature/fido/fido-helpers";
import { formatErrorMessage } from "@/lib/utils/common";

export default function FidoHandler() {
  const router = useRouter();
  const [formType, setFormType] = useState("registration");
  const [accountId, setAccountId] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleRegistration = async () => {
    setIsRegistering(true);
    try {
      const result = await executeFidoRegistration(accountId.trim(), service.trim());
      setMessage(result.message);
    } catch (error: any) {
      console.error(error);
      setMessage(formatErrorMessage(error, "Register Failed"));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAuthentication = async () => {
    setIsAuthenticating(true);
    try {
      const result = await executeFidoAuthentication(accountId.trim(), service.trim());
      setMessage(result.message);

      if (result.success && result.isNewUser !== undefined) {
        if (result.isNewUser) {
          router.push("/create-wallet");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessage(formatErrorMessage(error, "Authenticate Failed"));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (formType === "registration" && !isRegistering) {
        handleRegistration();
      } else if (formType === "authentication" && !isAuthenticating) {
        handleAuthentication();
      }
    }
  };

  return (
    <div
      className="container d-flex align-items-center justify-content-center font-monospace"
      style={{ backgroundColor: "#f8f9fa" }}
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      <div className="bg-white shadow-sm rounded p-4 text-center">
        <div className="mb-3">
          <div className="row">
            <div className="btn-group mb-3" role="group">
              <button onClick={() => setFormType("registration")}
                className={`btn ${formType === "registration" ? "btn-dark" : "btn-light"}`}
              >
                Registration
              </button>
              <button
                onClick={() => setFormType("authentication")}
                className={`btn ${formType === "authentication" ? "btn-dark" : "btn-light"}`}
              >
                Authentication
              </button>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 d-flex align-items-center">
              <label className="me-2">Service:</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="form-control mb-2"
              >
                <option value="" disabled>Select a service</option>
                <option value="MultiSig Vault">MultiSig Vault</option>
                {/* <option value="Real World Asset">Real World Asset</option>
                <option value="Inheritance/Trust">Inheritance/Trust</option> */}
              </select>
            </div>
            <div className="col-md-12 d-flex align-items-center">
              <label className="me-2">Account: </label>
              <input
                type="text"
                placeholder={service === "MultiSig Vault" ? "[Example] EmployeeID-Name" : "[Example] Username" }
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="form-control mb-2"
              />
            </div>
            {formType === "registration" && (
              <>
                <div className="col-md-8">
                  <button
                    onClick={handleRegistration}
                    className="btn btn-dark btn-block w-100"
                    disabled={isRegistering}
                  >
                    {isRegistering && (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    )}
                    FIDO Register
                  </button>
                </div>
                <div className="col-md-4">
                  {/* TODO: remove in the future */}
                  <button
                    className="btn btn-outline-secondary w-100"
                    type="button"
                    onClick={() => {
                      const demo = cycleDemoAccount(accountId);
                      setAccountId(demo.accountId);
                      setService(demo.service);
                    }}
                  >
                    Demo Account
                  </button>
                </div>
              </>
            )}

            {formType === "authentication" && (
              <>
                <div className="col-md-8">
                  <button
                    onClick={handleAuthentication}
                    className="btn btn-dark btn-block w-100"
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating && (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    )}
                  FIDO Authentication
                  </button>
                </div>
                <div className="col-md-4">
                  {/* TODO: remove in the future */}
                  <button
                    className="btn btn-outline-secondary w-100"
                    type="button"
                    onClick={() => {
                      const demo = cycleDemoAccount(accountId);
                      setAccountId(demo.accountId);
                      setService(demo.service);
                    }}
                  >
                    Demo Account
                  </button>
                </div>
              </>
            )}
          </div>

          {message && <p className="mt-3 text-danger">{message}</p>}
        </div>
      </div>
    </div>
  );
}
