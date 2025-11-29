import type { Metadata } from "next";
import { Teachers } from "next/font/google";
import "./globals.css";

const teachers = Teachers({
  subsets: ["latin"],
  variable: "--font-teachers",
});

export const metadata: Metadata = {
  title: "Video Call App",
  description: "Seamless video calling with AI captions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${teachers.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
