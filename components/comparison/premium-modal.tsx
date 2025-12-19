"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, X, Sparkles, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PremiumModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onActivatePremium: () => void
}

export function PremiumModal({ open, onOpenChange, onActivatePremium }: PremiumModalProps) {
  const features = [
    {
      title: "Estadísticas de otros",
      description:
        "Ver estadísticas de partidas que generaron otras personas, aumentando la cantidad de información hasta 5 veces más",
      free: false,
      premium: true,
    },
    {
      title: "Comparación múltiple",
      description: "Poder comparar tus estadísticas con un equipo entero (hasta 5 jugadores)",
      free: false,
      premium: true,
    },
    {
      title: "Conexión con jugadores",
      description: "Conectarse con otros jugadores para poder formar equipos en base al desempeño y roles",
      free: false,
      premium: true,
      inDevelopment: true,
    },
  ]

  const paymentMethods = ["Rapipago", "Pagofácil", "Mercadopago", "Tarjetas de crédito/débito"]

  const handleActivatePremium = () => {
    onActivatePremium()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Hacerse Premium</DialogTitle>
          </div>
          <DialogDescription className="text-white">
            Desbloquea todas las funcionalidades y lleva tu experiencia al siguiente nivel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <Button
              onClick={handleActivatePremium}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg font-semibold"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Obtener Premium por $7.500/mes
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Comparación de Planes</h3>
            <TooltipProvider>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-card/50 border-b border-border">
                      <th className="text-left p-3 text-white font-semibold text-sm">Característica</th>
                      <th className="text-center p-3 text-white font-semibold text-sm w-24">Free</th>
                      <th className="text-center p-3 text-white font-semibold text-sm w-24">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, index) => (
                      <tr key={index} className="border-b border-border/50 last:border-0 hover:bg-card/30">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white">{feature.title}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{feature.description}</p>
                              </TooltipContent>
                            </Tooltip>
                            {feature.inDevelopment && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                En desarrollo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {feature.free ? (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-400 mx-auto" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {feature.premium ? (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TooltipProvider>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Medios de Pago</h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <div key={method} className="flex items-center gap-2 p-3 bg-card/50 rounded-lg border border-border">
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white">{method}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
