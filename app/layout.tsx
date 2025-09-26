import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SecuX Cyber Athena</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f5f7fa", fontFamily: "'Roboto', sans-serif" }}>
        {children}

        {/* Global Toast Container */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 8000,
            style: {
              background: "#363636",
              color: "#fff",
              fontSize: "14px",
              borderRadius: "8px",
              padding: "16px",
            },
            success: {
              duration: 10000,
              iconTheme: {
                primary: "#4aed88",
                secondary: "#fff",
              },
            },
            error: {
              duration: 12000,
              iconTheme: {
                primary: "#ff6b6b",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
