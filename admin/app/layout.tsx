import "./globals.css";
import { ToastProvider } from "@/app/context/ToastContext";
import AdminNavbar from "@/app/components/AdminNavbar";

export const metadata = {
  title: "Korezi Admin",
  description: "Admin panel for Korezi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AdminNavbar />
           {children}
         </ToastProvider>
      </body>
    </html>
  );
}
