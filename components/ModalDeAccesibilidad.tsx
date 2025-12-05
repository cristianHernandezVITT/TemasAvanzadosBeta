"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useEffect, useCallback, useRef, useState } from "react";

import {
  HelpCircle, Eye, Type, ZoomIn, Palette, Code2, Hand, KeyboardIcon,
  MousePointerClick, Brain, Volume2, Focus, Mic
} from "lucide-react";

import { useAccessibility } from "@/hooks/useAccessibility";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceControl } from "@/hooks/useVoiceControl";
import { useTheme } from "next-themes";

// Mapa de comandos de voz para preferencias
const VOICE_PREFERENCE_MAP: { [key: string]: { preference: string; keywords: string[] } } = {
  altoContraste: { preference: "altoContraste", keywords: ["alto contraste", "contraste alto", "contraste"] },
  inversionColores: { preference: "inversionColores", keywords: ["inversión de colores", "inversion de colores", "invertir colores"] },
  lupaCursor: { preference: "lupaCursor", keywords: ["lupa", "lupa cursor", "zoom cursor"] },
  quitarEstilosCSS: { preference: "quitarEstilosCSS", keywords: ["quitar estilos", "sin estilos", "estilos css"] },
  areaClicAumentada: { preference: "areaClicAumentada", keywords: ["área de clic", "area de clic", "clic aumentado"] },
  notificacionesVisuales: { preference: "notificacionesVisuales", keywords: ["notificaciones visuales", "notificaciones"] },
  modoMonocromatico: { preference: "modoMonocromatico", keywords: ["monocromático", "monocromatico", "blanco y negro"] },
  resaltadoEnlaces: { preference: "resaltadoEnlaces", keywords: ["resaltado enlaces", "resaltar enlaces", "enlaces"] },
  guiaPasoAPaso: { preference: "guiaPasoAPaso", keywords: ["guía paso a paso", "guia paso a paso", "paso a paso"] },
  tecladoPantalla: { preference: "tecladoPantalla", keywords: ["teclado pantalla", "teclado virtual", "teclado"] },
  pulsacionLenta: { preference: "pulsacionLenta", keywords: ["pulsación lenta", "pulsacion lenta", "teclas lentas"] },
  punteroGrande: { preference: "punteroGrande", keywords: ["puntero grande", "cursor grande", "puntero"] },
  controlVoz: { preference: "controlVoz", keywords: ["control de voz", "control voz", "voz"] },
  lecturaVozAlta: { preference: "lecturaVozAlta", keywords: ["lectura en voz alta", "lectura voz alta", "leer en voz alta"] },
  simplificacionInterfaz: { preference: "simplificacionInterfaz", keywords: ["simplificación", "simplificacion", "interfaz simple"] },
  enfoqueLineaHorizontal: { preference: "enfoqueLineaHorizontal", keywords: ["enfoque línea", "enfoque linea", "línea horizontal", "linea horizontal"] },
  lenguajeSenas: { preference: "lenguajeSenas", keywords: ["lenguaje de señas", "lenguaje de senas", "señas", "senas"] },
  alfabetoSenas: { preference: "alfabetoSenas", keywords: ["alfabeto señas", "alfabeto senas", "deletrear señas"] },
};

// Temas disponibles
const THEME_KEYWORDS: { [key: string]: string } = {
  "claro": "light",
  "light": "light",
  "oscuro": "dark",
  "dark": "dark",
  "sistema": "system",
  "system": "system",
  "daltonismo": "colorblind",
  "daltónico": "colorblind",
  "colorblind": "colorblind",
  "daltonismo general": "daltonismo-general",
  "protanopia": "protanopia",
  "deuteranopia": "deuteranopia",
  "tritanopia": "tritanopia",
};

export function AccessibilityModal({ open, onOpenChange, showSaveButton = true }: { open: boolean, onOpenChange: (value: boolean) => void, showSaveButton?: boolean }) {
  
  const { preferences, updatePreference, savePreferencesToDB } = useAccessibility();
  const { usuario } = useAuth();
  const { voiceError, audioLevel, lastCommand, microphones } = useVoiceControl();
  const { setTheme } = useTheme();
  const [selectTemasOpen, setSelectTemasOpen] = useState(false);
  const selectTemasRef = useRef<HTMLButtonElement>(null);

  // Procesar comandos de voz para el modal
  const processModalVoiceCommand = useCallback((command: string) => {
    const lowerCommand = command.toLowerCase().trim();
    console.log("Comando de voz en modal:", lowerCommand);

    // Comando para cerrar
    if (lowerCommand.includes("cerrar") || lowerCommand === "cerrar modal" || lowerCommand === "cerrar ayudas") {
      onOpenChange(false);
      return true;
    }

    // Comando para guardar
    if (lowerCommand.includes("guardar") || lowerCommand === "guardar cambios") {
      savePreferencesToDB();
      return true;
    }

    // Comando para abrir temas
    if (lowerCommand === "temas" || lowerCommand === "abrir temas" || lowerCommand.includes("seleccionar tema")) {
      setSelectTemasOpen(true);
      selectTemasRef.current?.click();
      return true;
    }

    // Comando para seleccionar un tema específico
    for (const [keyword, theme] of Object.entries(THEME_KEYWORDS)) {
      if (lowerCommand.includes(keyword)) {
        console.log(`Cambiando tema a: ${theme}`);
        setTheme(theme);
        return true;
      }
    }

    // Comando para seleccionar/activar preferencia
    const isActivate = lowerCommand.includes("activar") || lowerCommand.includes("seleccionar") || 
                       lowerCommand.includes("marcar") || lowerCommand.includes("habilitar");
    const isDeactivate = lowerCommand.includes("quitar") || lowerCommand.includes("desactivar") || 
                         lowerCommand.includes("desmarcar") || lowerCommand.includes("deshabilitar");

    for (const [key, config] of Object.entries(VOICE_PREFERENCE_MAP)) {
      for (const keyword of config.keywords) {
        if (lowerCommand.includes(keyword)) {
          if (isActivate) {
            updatePreference(config.preference as any, true);
            console.log(`Activando: ${config.preference}`);
            return true;
          } else if (isDeactivate) {
            updatePreference(config.preference as any, false);
            console.log(`Desactivando: ${config.preference}`);
            return true;
          } else {
            // Toggle si no se especifica activar/desactivar
            const currentValue = (preferences as any)[config.preference];
            updatePreference(config.preference as any, !currentValue);
            console.log(`Toggle: ${config.preference} -> ${!currentValue}`);
            return true;
          }
        }
      }
    }

    return false;
  }, [onOpenChange, preferences, updatePreference, savePreferencesToDB, setTheme]);

  // Escuchar cambios en lastCommand cuando el modal está abierto
  useEffect(() => {
    if (open && lastCommand && preferences.controlVoz) {
      processModalVoiceCommand(lastCommand);
    }
  }, [open, lastCommand, preferences.controlVoz, processModalVoiceCommand]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("modal-closed"));
        }
      }}
    >
      <DialogContent className="max-w-2xl" style={{ animation: "none" }}>
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Herramientas de Accesibilidad
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Activa las herramientas de accesibilidad que necesites
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto ayudas-modal">
            {/* Visuales */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Visuales
              </h3>
              <div className="space-y-2 pl-7">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "altoContraste",
                      !preferences.altoContraste
                    )
                  }
                >
                  <Checkbox
                    id="alto-contraste-desktop"
                    checked={preferences.altoContraste}
                    onCheckedChange={(checked) =>
                      updatePreference("altoContraste", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="alto-contraste-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Modo de alto contraste
                  </Label>
                </div>
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <Type className="h-5 w-5 text-blue-500" />
                    <Label
                      htmlFor="ajuste-tamaño-letra-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Ajuste de tamaño y tipo de letra
                    </Label>
                  </div>
                  <div className="flex gap-2 ml-8">
                    <Button
                      variant={
                        preferences.ajusteTamanoLetra === "normal"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updatePreference("ajusteTamanoLetra", "normal")
                      }
                      className="flex-1"
                    >
                      Normal
                    </Button>
                    <Button
                      variant={
                        preferences.ajusteTamanoLetra === "grande"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updatePreference("ajusteTamanoLetra", "grande")
                      }
                      className="flex-1"
                    >
                      Grande
                    </Button>
                    <Button
                      variant={
                        preferences.ajusteTamanoLetra === "extra-grande"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updatePreference("ajusteTamanoLetra", "extra-grande")
                      }
                      className="flex-1"
                    >
                      Extra Grande
                    </Button>
                  </div>
                </div>
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <ZoomIn className="h-5 w-5 text-green-500" />
                    <Label
                      htmlFor="lupa-zoom-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Lupa o zoom de pantalla: {preferences.lupaZoom}%
                    </Label>
                  </div>
                  <div className="ml-8 space-y-2">
                    <Slider
                      value={[preferences.lupaZoom]}
                      onValueChange={(value) =>
                        updatePreference("lupaZoom", value[0])
                      }
                      min={100}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>100%</span>
                      <span>120%</span>
                      <span>150%</span>
                      <span>200%</span>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "inversionColores",
                      !preferences.inversionColores
                    )
                  }
                >
                  <Checkbox
                    id="inversion-colores-desktop"
                    checked={preferences.inversionColores}
                    onCheckedChange={(checked) =>
                      updatePreference("inversionColores", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Palette className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="inversion-colores-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Inversión de colores
                  </Label>
                </div>
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <Type className="h-5 w-5 text-indigo-500" />
                    <Label
                      htmlFor="tipo-letra-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Elegir el tipo de letra
                    </Label>
                  </div>
                  <div className="ml-8">
                    <Select
                      value={preferences.tipoLetra}
                      onValueChange={(value) =>
                        updatePreference("tipoLetra", value as any)
                      }
                    >
                      <SelectTrigger id="tipo-letra-desktop" className="w-full">
                        <SelectValue placeholder="Selecciona un tipo de letra" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Por defecto</SelectItem>
                        <SelectItem value="arial">Arial</SelectItem>
                        <SelectItem value="verdana">Verdana</SelectItem>
                        <SelectItem value="tahoma">Tahoma</SelectItem>
                        <SelectItem value="helvetica">Helvetica</SelectItem>
                        <SelectItem value="georgia">Georgia</SelectItem>
                        <SelectItem value="times">Times New Roman</SelectItem>
                        <SelectItem value="courier">Courier New</SelectItem>
                        <SelectItem value="comic-sans">
                          Comic Sans MS
                        </SelectItem>
                        <SelectItem value="trebuchet">Trebuchet MS</SelectItem>
                        <SelectItem value="impact">Impact</SelectItem>
                        <SelectItem value="lucida">Lucida Console</SelectItem>
                        <SelectItem value="palatino">
                          Palatino Linotype
                        </SelectItem>
                        <SelectItem value="gothic">Century Gothic</SelectItem>
                        <SelectItem value="franklin">
                          Franklin Gothic
                        </SelectItem>
                        <SelectItem value="bookman">
                          Bookman Old Style
                        </SelectItem>
                        <SelectItem value="garamond">Garamond</SelectItem>
                        <SelectItem value="baskerville">Baskerville</SelectItem>
                        <SelectItem value="calibri">Calibri</SelectItem>
                        <SelectItem value="cambria">Cambria</SelectItem>
                        <SelectItem value="consolas">Consolas</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                        <SelectItem value="open-sans">Open Sans</SelectItem>
                        <SelectItem value="lato">Lato</SelectItem>
                        <SelectItem value="montserrat">Montserrat</SelectItem>
                        <SelectItem value="raleway">Raleway</SelectItem>
                        <SelectItem value="ubuntu">Ubuntu</SelectItem>
                        <SelectItem value="playfair">
                          Playfair Display
                        </SelectItem>
                        <SelectItem value="merriweather">
                          Merriweather
                        </SelectItem>
                        <SelectItem value="source-sans">
                          Source Sans Pro
                        </SelectItem>
                        <SelectItem value="pt-sans">PT Sans</SelectItem>
                        <SelectItem value="oswald">Oswald</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <ZoomIn className="h-5 w-5 text-cyan-500" />
                    <Label
                      htmlFor="lupa-cursor-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Lupa Cursor: {preferences.lupaCursorZoom}%
                    </Label>
                  </div>
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="lupa-cursor-desktop"
                        checked={preferences.lupaCursor}
                        onCheckedChange={(checked) =>
                          updatePreference("lupaCursor", checked as boolean)
                        }
                        className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor="lupa-cursor-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Activar lupa cursor
                      </Label>
                    </div>
                    {preferences.lupaCursor && (
                      <div className="mt-2">
                        <Slider
                          value={[preferences.lupaCursorZoom]}
                          onValueChange={(value) =>
                            updatePreference("lupaCursorZoom", value[0])
                          }
                          min={150}
                          max={300}
                          step={50}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>150%</span>
                          <span>200%</span>
                          <span>250%</span>
                          <span>300%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "quitarEstilosCSS",
                      !preferences.quitarEstilosCSS
                    )
                  }
                >
                  <Checkbox
                    id="quitar-estilos-css-desktop"
                    checked={preferences.quitarEstilosCSS}
                    onCheckedChange={(checked) =>
                      updatePreference("quitarEstilosCSS", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Code2 className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="quitar-estilos-css-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Quitar estilos CSS
                  </Label>
                </div>
              </div>
            </div>

            {/* Motoras y físicas */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Hand className="h-5 w-5 text-primary" />
                Motoras y físicas
              </h3>
              <div className="space-y-2 pl-7">
                {/* Teclado en pantalla */}
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <KeyboardIcon className="h-5 w-5 text-indigo-500" />
                    <Label
                      htmlFor="teclado-pantalla-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Teclado en pantalla
                    </Label>
                  </div>
                  <div className="ml-8 space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="teclado-pantalla-desktop"
                        checked={preferences.tecladoPantalla}
                        onCheckedChange={(checked) =>
                          updatePreference(
                            "tecladoPantalla",
                            checked as boolean
                          )
                        }
                        className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor="teclado-pantalla-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Activar teclado virtual
                      </Label>
                    </div>
                    {preferences.tecladoPantalla && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Tamaño de teclas:
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            variant={
                              preferences.tamanoTeclas === "normal"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updatePreference("tamanoTeclas", "normal")
                            }
                            className="flex-1"
                          >
                            Normal
                          </Button>
                          <Button
                            variant={
                              preferences.tamanoTeclas === "grande"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updatePreference("tamanoTeclas", "grande")
                            }
                            className="flex-1"
                          >
                            Grande
                          </Button>
                          <Button
                            variant={
                              preferences.tamanoTeclas === "extra-grande"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updatePreference("tamanoTeclas", "extra-grande")
                            }
                            className="flex-1"
                          >
                            Extra Grande
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pulsación lenta */}
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <MousePointerClick className="h-5 w-5 text-orange-500" />
                    <Label
                      htmlFor="pulsacion-lenta-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Pulsación lenta o filtrado de teclas
                    </Label>
                  </div>
                  <div className="ml-8 space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="pulsacion-lenta-desktop"
                        checked={preferences.pulsacionLenta}
                        onCheckedChange={(checked) =>
                          updatePreference("pulsacionLenta", checked as boolean)
                        }
                        className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor="pulsacion-lenta-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Activar filtrado de pulsaciones
                      </Label>
                    </div>
                    {preferences.pulsacionLenta && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Tiempo mínimo: {preferences.tiempoPulsacion}ms
                        </Label>
                        <Slider
                          value={[preferences.tiempoPulsacion]}
                          onValueChange={(value) =>
                            updatePreference("tiempoPulsacion", value[0])
                          }
                          min={100}
                          max={2000}
                          step={100}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>100ms</span>
                          <span>500ms</span>
                          <span>1000ms</span>
                          <span>1500ms</span>
                          <span>2000ms</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Puntero grande */}
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <MousePointerClick className="h-5 w-5 text-cyan-500" />
                    <Label
                      htmlFor="puntero-grande-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Puntero grande
                    </Label>
                  </div>
                  <div className="ml-8 space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="puntero-grande-desktop"
                        checked={preferences.punteroGrande}
                        onCheckedChange={(checked) =>
                          updatePreference("punteroGrande", checked as boolean)
                        }
                        className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor="puntero-grande-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Activar puntero grande
                      </Label>
                    </div>
                    {preferences.punteroGrande && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Tamaño: {preferences.tamanoPuntero}x
                        </Label>
                        <Slider
                          value={[preferences.tamanoPuntero]}
                          onValueChange={(value) =>
                            updatePreference("tamanoPuntero", value[0])
                          }
                          min={1}
                          max={5}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1x</span>
                          <span>2x</span>
                          <span>3x</span>
                          <span>4x</span>
                          <span>5x</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cognitivas */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Cognitivas
              </h3>
              <div className="space-y-2 pl-7">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "lecturaVozAlta",
                      !preferences.lecturaVozAlta
                    )
                  }
                >
                  <Checkbox
                    id="lectura-voz-alta-desktop"
                    checked={preferences.lecturaVozAlta}
                    onCheckedChange={(checked) =>
                      updatePreference("lecturaVozAlta", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Volume2 className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="lectura-voz-alta-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Lectura en voz alta del contenido
                  </Label>
                </div>
                {preferences.lecturaVozAlta && (
                  <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <Volume2 className="h-5 w-5 text-green-500" />
                      <Label
                        htmlFor="volumen-amplificacion-desktop"
                        className="text-sm font-medium flex-1"
                      >
                        Amplificación del sonido:{" "}
                        {preferences.volumenAmplificacion}%
                      </Label>
                    </div>
                    <div className="ml-8 space-y-2">
                      <Slider
                        value={[preferences.volumenAmplificacion]}
                        onValueChange={(value) =>
                          updatePreference("volumenAmplificacion", value[0])
                        }
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                )}
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "simplificacionInterfaz",
                      !preferences.simplificacionInterfaz
                    )
                  }
                >
                  <Checkbox
                    id="simplificacion-interfaz-desktop"
                    checked={preferences.simplificacionInterfaz}
                    onCheckedChange={(checked) =>
                      updatePreference(
                        "simplificacionInterfaz",
                        checked as boolean
                      )
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Focus className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="simplificacion-interfaz-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Simplificación de interfaz
                  </Label>
                </div>
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "enfoqueLineaHorizontal",
                      !preferences.enfoqueLineaHorizontal
                    )
                  }
                >
                  <Checkbox
                    id="enfoque-linea-horizontal-desktop"
                    checked={preferences.enfoqueLineaHorizontal}
                    onCheckedChange={(checked) =>
                      updatePreference(
                        "enfoqueLineaHorizontal",
                        checked as boolean
                      )
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Focus className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="enfoque-linea-horizontal-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Enfoque en línea horizontal
                  </Label>
                </div>

                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference("controlVoz", !preferences.controlVoz)
                  }
                >
                  <Checkbox
                    id="control-voz-desktop"
                    checked={preferences.controlVoz}
                    onCheckedChange={(checked) =>
                      updatePreference("controlVoz", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Mic className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="control-voz-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Control por mando de voz
                  </Label>
                </div>

                {preferences.controlVoz && (
                  <div className="ml-8 space-y-3 p-3 bg-accent/20 rounded-lg border border-border/50">
                    {voiceError && (
                      <div className="text-xs text-red-500 font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        {voiceError}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Nivel de voz</span>
                        <span>{audioLevel}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-100 ease-out"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                    {lastCommand && (
                      <div className="p-2 bg-background rounded border text-xs">
                        <span className="text-muted-foreground block mb-1">
                          Último comando:
                        </span>
                        <span className="font-mono font-medium text-primary">
                          "{lastCommand}"
                        </span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Micrófonos:
                      </Label>
                      {microphones && microphones.length > 0 ? (
                        <ul className="text-xs space-y-1 max-h-20 overflow-y-auto">
                          {microphones.map((mic, idx) => (
                            <li
                              key={mic.deviceId || idx}
                              className="flex items-center gap-2 text-foreground/80"
                            >
                              <Mic className="h-3 w-3" />
                              <span className="truncate">
                                {mic.label || `Micrófono ${idx + 1}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Detectando...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {usuario && showSaveButton && (
          <div className="pt-4 border-t flex justify-end">
            <Button
              onClick={savePreferencesToDB}
              className="bg-primary text-white"
              size="sm"
            >
              Guardar Cambios
            </Button>
          </div>
        )}

        </DialogContent>
      </Dialog>
  );
}
