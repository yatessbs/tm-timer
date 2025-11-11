// app/layout.jsx
export const metadata = {
  title: "Toastmasters Timer",
  description: "A YES Application for timing toastmaster speeches",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
