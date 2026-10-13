import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import { buildFaviconUri } from '@/lib/build-favicon-uri';
import { getLogoSrc } from '@/lib/get-logo-src';
import { inter, FONT_CLASS_MAP } from '@/lib/fonts';
import { TemplateLayout } from '@/components/custom/template-layout';
import { LogoSrcProvider } from '@/components/custom/logo-src-provider';
import { SplashScreen } from '@/components/custom/splash-screen';
import { TemplateI18nProvider } from '../lib/i18n/provider';
import './globals.css';
import './custom.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export function generateMetadata(): Metadata {
  const faviconUri = buildFaviconUri();
  const title = process.env.NEXT_PUBLIC_DERIV_APP_NAME?.trim() || 'Deriv Rise/Fall Trading App';
  const description = 'A white-label trading application powered by Deriv';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    ...(faviconUri ? { icons: { icon: faviconUri } } : {}),
  };
}

const fontClass =
  FONT_CLASS_MAP[process.env.NEXT_PUBLIC_FONT_FAMILY ?? 'Inter'] ??
  inter.className;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const logoSrc = getLogoSrc();
  return (
    <html lang="en" className="h-full w-full overflow-hidden" suppressHydrationWarning>
      <body
        className={`${fontClass} ${ibmPlexSans.variable} h-full w-full overflow-hidden bg-background flex flex-col items-center justify-start text-foreground antialiased`}
      >
        <SplashScreen logoSrc={logoSrc} />
        <div className="w-full h-full max-w-md mx-auto flex flex-col flex-1 min-h-0 overflow-hidden bg-background relative">
          <TemplateI18nProvider>
            <TemplateLayout>
              <LogoSrcProvider logoSrc={logoSrc}>{children}</LogoSrcProvider>
            </TemplateLayout>
          </TemplateI18nProvider>
        </div>
      </body>
    </html>
  );
}
