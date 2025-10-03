"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, X, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface PremiumModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const features = [
    {
      title: "Ver estadísticas de partidas generadas por otros",
      description: "Aumenta la cantidad de información hasta 5 veces más",
      free: false,
      premium: true,
    },
    {
      title: "Comparar con un equipo entero",
      description: "Compara tus estadísticas con hasta 5 jugadores simultáneamente",
      free: false,
      premium: true,
    },
    {
      title: "Conectarse con otros jugadores",
      description: "Forma equipos en base al desempeño y roles (En desarrollo)",
      free: false,
      premium: true,
      inDevelopment: true,
    },
  ]

  const paymentMethods = ["Rapipago", "Pagofácil", "Mercadopago", "Tarjetas de crédito/débito"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Hacerse Premium</DialogTitle>
          </div>
          <DialogDescription>
            Desbloquea todas las funcionalidades y lleva tu experiencia al siguiente nivel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pricing Section */}
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">$1.500</div>
                <div className="text-muted-foreground">Pesos Argentinos</div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Medios de Pago</h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <div key={method} className="flex items-center gap-2 p-3 bg-card/50 rounded-lg border border-border">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-white">{method}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features Comparison */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Comparación de Planes</h3>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <Card key={index} className="bg-card/30 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{feature.title}</h4>
                          {feature.inDevelopment && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                              En desarrollo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <div className="flex gap-8">
                        <div className="text-center min-w-[60px]">
                          <div className="text-xs text-muted-foreground mb-2">Free</div>
                          {feature.free ? (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-400 mx-auto" />
                          )}
                        </div>
                        <div className="text-center min-w-[60px]">
                          <div className="text-xs text-muted-foreground mb-2">Premium</div>
                          {feature.premium ? (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-400 mx-auto" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90">
              <Sparkles className="h-4 w-4 mr-2" />
              Obtener Premium
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
