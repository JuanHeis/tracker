import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

export const metadata = {
  title: "Expense Tracker",
  description: "Track your expenses and income",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={nunitoSans.variable}>
      <body className="font-sans dark">{children}</body>
    </html>
  );
}
