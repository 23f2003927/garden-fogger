import "./globals.css";

export const metadata = {
  title: "SmartFarm — AI-Powered Agronomic Intelligence",
  description:
    "SmartFarm combines spectral sensing, environmental monitoring, and crop intelligence models to help polyhouse farmers monitor crop health and make data-driven decisions.",
  keywords: ["SmartFarm", "precision agriculture", "spectral sensor", "polyhouse", "crop health", "IoT"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=Courier+Prime:wght@400;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
