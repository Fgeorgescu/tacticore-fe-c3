export interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatGPTRequest {
  model: string;
  messages: ChatGPTMessage[];
  max_tokens: number;
  temperature: number;
}

export interface ChatGPTResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export interface MatchContext {
  map: string;
  kills: number;
  deaths: number;
  kdRatio: number;
  score: number;
  goodPlays: number;
  badPlays: number;
  duration: string;
  gameType: string;
}

export class ChatGPTService {
  private apiKey: string;
  private apiUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    // Para desarrollo, usar API key pública
    // En producción, esto debería venir del backend
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    
    console.log('ChatGPT Service initialized');
    console.log('API Key available:', !!this.apiKey);
    console.log('API Key length:', this.apiKey.length);
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. ChatGPT functionality will be disabled.');
    }
  }

  async sendMessage(userMessage: string, matchContext: MatchContext): Promise<string> {
    console.log('ChatGPT sendMessage called with:', { userMessage, matchContext });
    
    if (!this.apiKey) {
      console.log('No API key available');
      return 'Lo siento, el bot no está disponible en este momento.';
    }

    // Modo de desarrollo: usar respuestas mock si no hay créditos
    const useMockResponses = process.env.NEXT_PUBLIC_USE_MOCK_RESPONSES === 'true';
    if (useMockResponses) {
      return this.generateMockResponse(userMessage, matchContext);
    }

    return this.sendMessageWithRetry(userMessage, matchContext, 0);
  }

  private async sendMessageWithRetry(userMessage: string, matchContext: MatchContext, retryCount: number): Promise<string> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 segundo base

    try {
      const systemPrompt = this.buildSystemPrompt(matchContext);
      console.log('System prompt built:', systemPrompt.substring(0, 100) + '...');
      
      const request: ChatGPTRequest = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      };

      console.log(`Sending request to OpenAI API... (attempt ${retryCount + 1})`);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      console.log('OpenAI API response status:', response.status);
      
      if (response.status === 429) {
        // Rate limit exceeded
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Rate limit exceeded. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          await this.sleep(delay);
          return this.sendMessageWithRetry(userMessage, matchContext, retryCount + 1);
        } else {
          return 'Lo siento, he recibido demasiadas solicitudes. Por favor, espera un momento y vuelve a intentar.';
        }
      }

      if (response.status === 402) {
        // Insufficient quota
        return 'Lo siento, mi cuenta de OpenAI no tiene créditos suficientes. Por favor, contacta al administrador para agregar fondos a la cuenta.';
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatGPTResponse = await response.json();
      console.log('OpenAI API response data:', data);
      
      return data.choices[0]?.message?.content || 'No pude generar una respuesta.';

    } catch (error) {
      console.error('Error calling ChatGPT API:', error);
      
      // Check for quota error in response
      if (error instanceof Error && error.message.includes('insufficient_quota')) {
        return 'Lo siento, mi cuenta de OpenAI no tiene créditos suficientes. Por favor, contacta al administrador para agregar fondos a la cuenta.';
      }
      
      if (retryCount < maxRetries && error instanceof Error && error.message.includes('429')) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Retrying after error in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        await this.sleep(delay);
        return this.sendMessageWithRetry(userMessage, matchContext, retryCount + 1);
      }
      
      return 'Lo siento, hubo un error al procesar tu consulta. Inténtalo de nuevo.';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateMockResponse(userMessage: string, matchContext: MatchContext): string {
    console.log('Generating mock response for development');
    
    const responses = [
      `Basándome en tu partida en ${matchContext.map} con ${matchContext.kills} kills y ${matchContext.deaths} deaths, te recomiendo mejorar tu posicionamiento y usar más cobertura.`,
      `Tu K/D de ${matchContext.kdRatio.toFixed(2)} indica que necesitas trabajar en tu precisión. Prueba ajustar la sensibilidad del mouse.`,
      `En ${matchContext.map}, es importante controlar los puntos clave del mapa. Tu score de ${matchContext.score.toFixed(1)}/10 sugiere que hay margen de mejora.`,
      `Para mejorar tu rendimiento, enfócate en la comunicación con tu equipo y el timing de tus movimientos.`,
      `Tu partida de ${matchContext.duration} minutos muestra que necesitas ser más agresivo en las rondas económicas.`
    ];
    
    // Simular delay de API
    return new Promise(resolve => {
      setTimeout(() => {
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        resolve(randomResponse);
      }, 1000 + Math.random() * 2000); // 1-3 segundos de delay
    }) as any;
  }

  private buildSystemPrompt(matchContext: MatchContext): string {
    return `Eres TACTICORE Bot, un experto analista de Counter-Strike. Tu trabajo es analizar partidas y dar consejos específicos para mejorar el rendimiento del jugador.

CONTEXTO DE LA PARTIDA ACTUAL:
- Mapa: ${matchContext.map}
- Kills: ${matchContext.kills}
- Deaths: ${matchContext.deaths}
- K/D Ratio: ${matchContext.kdRatio.toFixed(2)}
- Score: ${matchContext.score.toFixed(1)}/10
- Buenas jugadas: ${matchContext.goodPlays}
- Malas jugadas: ${matchContext.badPlays}
- Duración: ${matchContext.duration}
- Tipo de juego: ${matchContext.gameType}

INSTRUCCIONES:
1. Responde de manera útil y específica basándote en los datos de la partida
2. Da consejos prácticos para mejorar el rendimiento
3. Sé conciso pero informativo (máximo 200 palabras)
4. Usa un tono amigable pero profesional
5. Si no tienes suficiente información, pide más detalles específicos

Responde siempre en español y enfócate en ayudar al jugador a mejorar.`;
  }
}

// Instancia singleton
export const chatGPTService = new ChatGPTService();
