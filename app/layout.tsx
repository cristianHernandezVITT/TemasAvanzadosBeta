import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { RolesModulesProvider } from "@/hooks/useRolesModules";
import { AccessibilityProvider } from "@/hooks/useAccessibility";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { MagnifierCursor } from "@/components/MagnifierCursor";
import { ScreenReader } from "@/components/ScreenReader";
import { VirtualKeyboard } from "@/components/VirtualKeyboard";
import { SlowClickHandler } from "@/components/SlowClickHandler";
import { LargeCursor } from "@/components/LargeCursor";
import { HorizontalFocusLine } from "@/components/HorizontalFocusLine";
import { VoiceCommandModal } from "@/components/VoiceCommandModal";
import { VisualNotifications } from "@/components/VisualNotifications";
import { StepByStepGuide } from "@/components/StepByStepGuide";
import { SignLanguageAlphabet } from "@/components/SignLanguageAlphabet";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema Escolar",
  description: "Sistema de gestión y análisis académico",
  generator: "v0.app",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <RolesModulesProvider>
              <AccessibilityProvider>
                <MagnifierCursor />
                <ScreenReader />
                <VirtualKeyboard />
                <SlowClickHandler />
                <LargeCursor />
                <HorizontalFocusLine />
                <VoiceCommandModal />
                <VisualNotifications />
                <StepByStepGuide />
                <SignLanguageAlphabet />
                <ConditionalLayout>{children}</ConditionalLayout>
                <Toaster position="top-right" />
                <Analytics />
              </AccessibilityProvider>
            </RolesModulesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
