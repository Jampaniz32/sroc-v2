
import { GoogleGenAI, Type } from "@google/genai";
import { CallType } from "./types";

/**
 * Serviço para obter assistência da IA na classificação de chamadas.
 * Utiliza o modelo Gemini 3 Flash para análise rápida e precisa de texto.
 */
export const getGeminiAssistance = async (observacoes: string) => {
  try {
    // Inicialização da instância conforme diretrizes (apiKey via process.env.API_KEY)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Lista dinâmica de tipos permitidos baseada no enum do sistema
    const allowedTypes = Object.values(CallType).join(", ");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise o seguinte relatório de atendimento bancário e selecione a categoria mais adequada.\n\nRelatório: "${observacoes}"`,
      config: {
        systemInstruction: `Você é um especialista em classificação de chamadas de suporte bancário. 
        Sua tarefa é ler as observações de um atendimento e escolher EXATAMENTE um dos seguintes tipos: [${allowedTypes}].
        Se a situação não se encaixar claramente em nenhuma das categorias específicas, utilize "Outro".`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tipo: {
              type: Type.STRING,
              description: "O tipo de pedido identificado nas observações.",
            }
          },
          required: ["tipo"]
        },
      },
    });

    // Acessa a propriedade .text diretamente conforme as novas regras do SDK
    const textOutput = response.text;
    if (!textOutput) return null;

    const result = JSON.parse(textOutput);
    
    // Validar se o tipo retornado existe no nosso Enum
    if (Object.values(CallType).includes(result.tipo as CallType)) {
      return result;
    }
    
    return { tipo: CallType.OUTRO };
  } catch (error) {
    console.error("Erro na assistência Gemini:", error);
    return null;
  }
};
