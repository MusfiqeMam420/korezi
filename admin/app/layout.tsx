import "./globals.css";
import { ToastProvider } from "@/app/context/ToastContext";

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
           {children}
         </ToastProvider>
      </body>
    </html>
  );
}
