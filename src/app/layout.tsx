// Minimal root layout — actual <html>/<body> chrome lives in [locale]/layout.tsx
// so that the `lang` attribute reflects the active locale. Next.js 13+ permits
// a passthrough root layout when a nested layout provides the html shell.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
