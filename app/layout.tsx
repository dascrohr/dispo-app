
import './globals.css';

export const metadata = {
  title: 'Dispo App Starter',
  description: 'Monats-Dispo für Techniker – Starterprojekt',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased text-gray-900">
        <div className="max-w-[1400px] mx-auto p-4">
          {children}
        </div>
      </body>
    </html>
  );
}
