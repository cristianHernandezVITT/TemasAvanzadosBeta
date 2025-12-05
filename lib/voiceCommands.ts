import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export interface VoiceCommand {
  id: string;
  keywords: string[];
  description: string;
  action: (router: AppRouterInstance, spoken: string) => void;
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    id: "nav-home",
    keywords: ["ir a inicio", "inicio", "home", "volver a inicio"],
    description: "Ir a la página de inicio",
    action: (router) => router.push("/"),
  },
  {
    id: "nav-registro",
    keywords: ["ir a registro", "registro", "registros"],
    description: "Ir a la página de registro",
    action: (router) => router.push("/registro"),
  },
  {
    id: "nav-usuarios",
    keywords: ["ir a usuarios", "usuarios", "lista de usuarios"],
    description: "Ir a la lista de usuarios",
    action: (router) => router.push("/usuarios"),
  },
  {
    id: "nav-login",
    keywords: ["ir a login", "login", "iniciar sesión"],
    description: "Ir a la página de login",
    action: (router) => router.push("/login"),
  },
];
