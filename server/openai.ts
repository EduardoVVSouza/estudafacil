import OpenAI from "openai";
import type { PdfDocument } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EditalAnalysis {
  subjects: string[];
  topics: { [subject: string]: string[] };
  examDate?: string;
  studyRecommendations: {
    prioritySubjects: string[];
    estimatedHoursPerSubject: { [subject: string]: number };
    weeklyDistribution: {
      [day: string]: {
        subject: string;
        topics: string[];
        hours: number;
      }[];
    };
  };
}

export async function analyzeEditalPDF(pdfContent: string, examDate: string): Promise<EditalAnalysis> {
  try {
    const prompt = `
Analise este edital de concurso público em português e extraia as seguintes informações:

1. MATÉRIAS: Liste todas as matérias/disciplinas cobradas
2. TÓPICOS: Para cada matéria, liste os principais tópicos/conteúdos
3. CRONOGRAMA: Considerando a data da prova (${examDate}), crie um plano de estudos distribuído pelos dias da semana

EDITAL:
${pdfContent}

Responda APENAS em formato JSON válido com esta estrutura:
{
  "subjects": ["matéria1", "matéria2", ...],
  "topics": {
    "matéria1": ["tópico1", "tópico2", ...],
    "matéria2": ["tópico1", "tópico2", ...]
  },
  "studyRecommendations": {
    "prioritySubjects": ["matéria com maior peso", ...],
    "estimatedHoursPerSubject": {
      "matéria1": 20,
      "matéria2": 15
    },
    "weeklyDistribution": {
      "Segunda": [{"subject": "matéria", "topics": ["tópico1"], "hours": 2}],
      "Terça": [{"subject": "matéria", "topics": ["tópico2"], "hours": 2}],
      "Quarta": [{"subject": "matéria", "topics": ["tópico3"], "hours": 2}],
      "Quinta": [{"subject": "matéria", "topics": ["tópico4"], "hours": 2}],
      "Sexta": [{"subject": "matéria", "topics": ["tópico5"], "hours": 2}],
      "Sábado": [{"subject": "revisão", "topics": ["revisão geral"], "hours": 4}],
      "Domingo": [{"subject": "simulados", "topics": ["testes práticos"], "hours": 3}]
    }
  }
}

IMPORTANTE: 
- Foque apenas em matérias realmente cobradas no edital
- Distribua o estudo de forma equilibrada
- Considere fins de semana para revisão e simulados
- Seja específico com os tópicos de cada matéria
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em concursos públicos brasileiros. Analise editais e crie cronogramas de estudo eficientes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysisText = response.choices[0].message.content;
    if (!analysisText) {
      throw new Error("Resposta vazia da OpenAI");
    }

    const analysis: EditalAnalysis = JSON.parse(analysisText);
    
    // Validação básica
    if (!analysis.subjects || !Array.isArray(analysis.subjects) || analysis.subjects.length === 0) {
      throw new Error("Análise inválida: nenhuma matéria encontrada");
    }

    return analysis;

  } catch (error) {
    console.error("Erro na análise do edital:", error);
    throw new Error("Falha ao analisar o edital. Verifique se o PDF contém um edital válido.");
  }
}

export async function extractTextFromPDF(base64Content: string): Promise<string> {
  try {
    // Para extrair texto do PDF, usamos o modelo de visão da OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extraia todo o texto deste PDF de edital de concurso público. Mantenha a formatação e estrutura original. Foque especialmente em seções sobre matérias, conteúdo programático, e requisitos da prova."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Content}`
              }
            }
          ],
        },
      ],
      max_tokens: 4000,
    });

    const extractedText = response.choices[0].message.content;
    if (!extractedText) {
      throw new Error("Não foi possível extrair texto do PDF");
    }

    return extractedText;

  } catch (error) {
    console.error("Erro na extração de texto:", error);
    throw new Error("Falha ao extrair texto do PDF. Verifique se o arquivo é um PDF válido.");
  }
}