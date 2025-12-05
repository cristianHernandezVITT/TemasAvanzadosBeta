"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAccessibility } from "./useAccessibility";

interface VoiceCommandHandler {
  id: string;
  keywords: string[];
  description: string;
  action: (command: string) => void;
}

interface UseArtyomVoiceOptions {
  onTextCaptured?: (text: string) => void;
}

export function useArtyomVoice(
  commands: VoiceCommandHandler[] = [],
  options?: UseArtyomVoiceOptions
) {
  const { preferences } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState("");
  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false);
  const commandsRef = useRef(commands);
  const optionsRef = useRef(options);

  // Mantener refs actualizados
  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const processVoiceInput = useCallback((transcript: string) => {
    const lowerTranscript = transcript.toLowerCase().trim();
    console.log("🎤 Texto reconocido:", lowerTranscript);
    setLastCommand(lowerTranscript);

    const currentCommands = commandsRef.current;
    const currentOptions = optionsRef.current;

    // Ordenar comandos por longitud de keywords (más largo primero para evitar conflictos)
    const sortedCommands = [...currentCommands].sort((a, b) => {
      const maxA = Math.max(...a.keywords.map(k => k.length));
      const maxB = Math.max(...b.keywords.map(k => k.length));
      return maxB - maxA;
    });

    // Primero buscar coincidencias exactas
    for (const cmd of sortedCommands) {
      for (const keyword of cmd.keywords) {
        const lowerKeyword = keyword.toLowerCase();
        if (lowerTranscript === lowerKeyword) {
          console.log("✅ Comando exacto encontrado:", cmd.id, "keyword:", keyword);
          cmd.action(lowerTranscript);
          return;
        }
      }
    }

    // Luego buscar si el transcript contiene algún keyword (ordenado por longitud)
    for (const cmd of sortedCommands) {
      for (const keyword of cmd.keywords.sort((a, b) => b.length - a.length)) {
        const lowerKeyword = keyword.toLowerCase();
        if (lowerTranscript.includes(lowerKeyword)) {
          console.log("📌 Comando parcial encontrado:", cmd.id, "keyword:", keyword);
          cmd.action(lowerTranscript);
          return;
        }
      }
    }

    // Palabras especiales que SÍ se envían como texto (espacio, guion, etc.)
    const specialTextWords = ["espacio", "space", "guion", "guión", "punto", "coma", "arroba"];
    if (specialTextWords.some(word => lowerTranscript === word)) {
      console.log("📝 Palabra especial enviada:", lowerTranscript);
      window.dispatchEvent(new CustomEvent("voice-modal-escribir", { detail: { texto: lowerTranscript } }));
      return;
    }
    
    // Palabras reservadas que NUNCA deben enviarse como texto libre
    const reservedWords = ["borrar", "limpiar", "vaciar", "eliminar", "cancelar", "cerrar", "guardar", "okey", "ok", "listo"];
    const containsReservedWord = reservedWords.some(word => lowerTranscript.includes(word));
    
    if (containsReservedWord) {
      // Si contiene una palabra reservada pero no se encontró comando, ejecutar la acción por defecto
      if (lowerTranscript.includes("borrar") || lowerTranscript.includes("limpiar") || lowerTranscript.includes("vaciar")) {
        console.log("🗑️ Ejecutando borrar campo por palabra reservada");
        window.dispatchEvent(new CustomEvent("voice-modal-borrar"));
        return;
      }
      if (lowerTranscript.includes("cancelar") || lowerTranscript.includes("cerrar")) {
        console.log("❌ Ejecutando cerrar modal por palabra reservada");
        window.dispatchEvent(new CustomEvent("voice-modal-cerrar"));
        return;
      }
      if (lowerTranscript.includes("guardar")) {
        console.log("💾 Ejecutando guardar por palabra reservada");
        window.dispatchEvent(new CustomEvent("voice-modal-guardar"));
        return;
      }
      if (lowerTranscript.includes("okey") || lowerTranscript === "ok" || lowerTranscript.includes("listo")) {
        console.log("✅ Ejecutando okey por palabra reservada");
        window.dispatchEvent(new CustomEvent("voice-modal-okey"));
        return;
      }
      console.log("⚠️ Palabra reservada detectada pero sin acción específica");
      return;
    }
    
    // Si no es un comando específico, enviar como texto libre al modal
    console.log("📝 Texto libre capturado:", transcript);
    window.dispatchEvent(new CustomEvent("voice-modal-escribir", { detail: { texto: transcript } }))
    
    // También llamar a onTextCaptured si está definido
    if (currentOptions?.onTextCaptured) {
      currentOptions.onTextCaptured(transcript);
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log("Deteniendo reconocimiento...");
    isActiveRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignorar errores al detener
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    
    // Si ya está activo, no hacer nada
    if (isActiveRef.current && recognitionRef.current) {
      console.log("Reconocimiento ya está activo");
      return;
    }

    // Verificar soporte de Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Reconocimiento de voz no soportado en este navegador");
      return;
    }

    // Limpiar instancia anterior si existe
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignorar
      }
      recognitionRef.current = null;
    }

    console.log("Iniciando reconocimiento de voz...");
    isActiveRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "es-ES";

    recognition.onstart = () => {
      console.log("Reconocimiento de voz iniciado");
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      console.log("Reconocimiento de voz terminado, isActive:", isActiveRef.current);
      
      // Solo reiniciar si aún está activo
      if (isActiveRef.current) {
        setTimeout(() => {
          if (isActiveRef.current && recognitionRef.current) {
            try {
              console.log("Reiniciando reconocimiento...");
              recognitionRef.current.start();
            } catch (e: any) {
              // Si ya está iniciado, ignorar
              if (!e.message?.includes("already started")) {
                console.error("Error reiniciando:", e);
              }
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      // Ignorar errores comunes que no son problemas reales
      if (event.error === "no-speech" || event.error === "aborted" || event.error === "network") {
        return; // No hacer nada, son errores normales
      }
      
      if (event.error === "not-allowed") {
        console.error("Permiso de micrófono denegado");
        setError("Permiso de micrófono denegado");
        isActiveRef.current = false;
      } else {
        console.error("Error de reconocimiento:", event.error);
      }
    };

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.trim();
      console.log("Texto reconocido:", transcript);
      processVoiceInput(transcript);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e: any) {
      if (!e.message?.includes("already started")) {
        console.error("Error iniciando reconocimiento:", e);
        isActiveRef.current = false;
      }
    }
  }, [processVoiceInput]);

  // Efecto para manejar cambios en controlVoz
  useEffect(() => {
    if (preferences.controlVoz) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [preferences.controlVoz]); // Solo depender de controlVoz

  return {
    isListening,
    error,
    lastCommand,
    startListening,
    stopListening,
  };
}
