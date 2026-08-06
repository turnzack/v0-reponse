import './globals.css';
import '../popup.css'; // On importe le CSS original de l'extension !

export const metadata = {
  title: 'KIROV5 Jarvis Fusion — UI',
  description: 'Interface de contrôle G5 Spiral',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="floating-mode">
        {children}
      </body>
    </html>
  );
}
