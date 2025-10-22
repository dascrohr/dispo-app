import './globals.css';

export const metadata = {
  title: 'Dispo App',
  description: 'Monatsdispo für Techniker – Echt-Datenversion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <div className="max-w-[1400px] mx-auto p-4">
          {children}
        </div>
      </body>
    </html>
  );
}