"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAccessibility } from "./useAccessibility";

interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export interface VoiceCommand {
  id: string;
  keywords: string[];
  description: string;
  action: (router: any, command: string) => void;
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    id: "nav-home",
    keywords: ["inicio", "dashboard", "principal"],
    description: "Ir al Dashboard",
    action: (router) => router.push("/"),
  },
  {
    id: "nav-users",
    keywords: ["usuario", "user", "usuarios"],
    description: "Ir a Usuarios",
    action: (router) => router.push("/usuarios"),
  },
  {
    id: "nav-carreras",
    keywords: ["carrera", "programa", "carreras"],
    description: "Ir a Carreras",
    action: (router) => router.push("/carreras"),
  },
  {
    id: "nav-materias",
    keywords: ["materia", "asignatura", "curso", "materias"],
    description: "Ir a Materias",
    action: (router) => router.push("/materias"),
  },
  {
    id: "nav-registro",
    keywords: ["registro", "estudiante", "alumno", "estudiantes"],
    description: "Ir a Registro de Estudiantes",
    action: (router) => router.push("/registro"),
  },
  {
    id: "nav-asignacion",
    keywords: ["asignación", "asignacion", "asignar"],
    description: "Ir a Asignación de Materias",
    action: (router) => router.push("/asignacion-materias"),
  },
  {
    id: "nav-histograma",
    keywords: ["histograma", "gráfico de barras"],
    description: "Ir a Histograma",
    action: (router) => router.push("/histograma"),
  },
  {
    id: "nav-control",
    keywords: ["gráfico de control", "control estadístico", "control"],
    description: "Ir a Gráfico de Control",
    action: (router) => router.push("/control"),
  },
  {
    id: "nav-pareto",
    keywords: ["pareto", "diagrama de pareto"],
    description: "Ir a Diagrama de Pareto",
    action: (router) => router.push("/pareto"),
  },
  {
    id: "nav-dispersion",
    keywords: ["dispersión", "diagrama de dispersión", "puntos"],
    description: "Ir a Diagrama de Dispersión",
    action: (router) => router.push("/dispersion"),
  },
  {
    id: "scroll-down",
    keywords: ["bajar", "abajo", "descender"],
    description: "Desplazarse hacia abajo",
    action: () => {
      const mainContent =
        document.querySelector("main") ||
        document.querySelector('[role="main"]') ||
        document.documentElement;
      if (mainContent) {
        mainContent.scrollBy({ top: 300, behavior: "smooth" });
      }
    },
  },
  {
    id: "scroll-up",
    keywords: ["subir", "arriba", "ascender"],
    description: "Desplazarse hacia arriba",
    action: () => {
      const mainContent =
        document.querySelector("main") ||
        document.querySelector('[role="main"]') ||
        document.documentElement;
      if (mainContent) {
        mainContent.scrollBy({ top: -300, behavior: "smooth" });
      }
    },
  },
  {
    id: "scroll-top",
    keywords: ["inicio de página", "principio", "arriba del todo"],
    description: "Ir al inicio de la página",
    action: () => {
      const mainContent =
        document.querySelector("main") ||
        document.querySelector('[role="main"]') ||
        document.documentElement;
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
  },
  {
    id: "scroll-bottom",
    keywords: ["fin de página", "final", "abajo del todo"],
    description: "Ir al final de la página",
    action: () => {
      const mainContent =
        document.querySelector("main") ||
        document.querySelector('[role="main"]') ||
        document.documentElement;
      if (mainContent) {
        mainContent.scrollTo({
          top: mainContent.scrollHeight,
          behavior: "smooth",
        });
      }
    },
  },
  {
    id: "help",
    keywords: ["ayuda", "accesibilidad", "herramienta"],
    description: "Abrir herramientas de accesibilidad",
    action: () => window.dispatchEvent(new CustomEvent("open-ayudas")),
  },
];

export function useVoiceControl() {
  const { preferences } = useAccessibility();
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [lastCommand, setLastCommand] = useState<string>("");
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRestarting = useRef(false);

  const processCommand = useCallback(
    (command: string) => {
      const foundCommand = VOICE_COMMANDS.find((cmd) =>
        cmd.keywords.some((keyword) => command.includes(keyword))
      );

      if (foundCommand) {
        foundCommand.action(router, command);
        if (!foundCommand.id.startsWith("select-field")) {
          toast.success(`Comando: ${foundCommand.description}`);
        }
      } else {
        toast.error(`Comando "${command}" no reconocido`);
      }
    },
    [router]
  );

  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setAudioLevel(0);
  }, []);

  const startAudioAnalysis = useCallback(async () => {
    try {
      stopAudioAnalysis();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);

      source.connect(analyser);

      analyserRef.current = analyser;
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const level = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(level);

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("No se pudo acceder al micrófono");
    }
  }, [stopAudioAnalysis]);

  const getMicrophones = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput"
      );
      setMicrophones(audioInputs);
    } catch (err) {
      console.error("Error listing microphones:", err);
    }
  }, []);

  // DESHABILITADO: El reconocimiento de voz ahora se maneja con artyom.js
  // Este useEffect está deshabilitado para evitar conflictos
  // Solo mantener la referencia para compatibilidad con otros componentes
  useEffect(() => {
    // No crear ni iniciar reconocimiento de voz aquí
    // Se usa artyom.js en su lugar
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Deshabilitado: Ahora se usa artyom.js en su lugar
  // Este hook solo se usa para obtener microphones, audioLevel, etc.
  // pero NO inicia el reconocimiento de voz
  useEffect(() => {
    // Solo obtener microphones y audio level, pero NO iniciar reconocimiento
    // El reconocimiento de voz ahora se maneja con artyom.js
    if (preferences.controlVoz) {
      startAudioAnalysis();
      getMicrophones();
    } else {
      stopAudioAnalysis();
      setLastCommand("");
    }

    return () => {
      stopAudioAnalysis();
    };
  }, [
    preferences.controlVoz,
    startAudioAnalysis,
    stopAudioAnalysis,
    getMicrophones,
  ]);

  return { isListening, error, audioLevel, microphones, lastCommand };
}
