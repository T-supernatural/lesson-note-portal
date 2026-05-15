import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export type AiLessonGenerationRequest = {
  subject: string;
  classLevel: string;
  topic: string;
  week: string;
  term?: string;
  duration: string;
  learningLevel: 'Simple' | 'Moderate' | 'Advanced';
  curriculumStyle: string;
  additionalInstructions?: string;
  generationMode?: 'short' | 'detailed';
};

export type AiGeneratedLessonNote = {
  objectives: string;
  materials: string;
  introduction: string;
  teachers_presentation: string;
  main_content: string;
  evaluation: string;
  assignment: string;
};

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const configuredModel = import.meta.env.VITE_GEMINI_MODEL?.trim();
const fallbackModels = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

// Utility: Sleep for specified milliseconds
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createPrompt = (params: AiLessonGenerationRequest) => {
  const mode = params.generationMode || 'short';
  const modeGuidance = mode === 'short'
    ? 'Keep content concise, structured, and teacher-friendly. Each section should be 2-4 sentences max, except main_content which can include essential teaching steps, activities, and a simple evaluation activity.'
    : 'Provide comprehensive, detailed content with rich examples. Include classroom activities and assessment methods.';

  return `Generate a Nigerian curriculum lesson note for ${params.classLevel} - Topic: ${params.topic}.

OUTPUT FORMAT: Return ONLY valid JSON. No markdown, no code fences, no commentary.

STRUCTURE (7 required fields):
1. objectives - Learning outcomes (4-6 bullet points, concise)
2. materials - Teaching resources (bulleted list)
3. introduction - Hook/opening activity (2-3 sentences)
4. teachers_presentation - Key concepts teacher explains (3-5 sentences)
5. main_content - Full teaching steps with activities (use <h2>, <h3>, <ul>, <li>, <table> HTML only for structure)
6. evaluation - Assessment method (2-3 sentences)
7. assignment - Student homework/task (2-3 sentences)

CONTENT GUIDELINES:
- Use simple, clear language appropriate for ${params.classLevel}
- Include one classroom activity in main_content
- Keep sentences short and direct
- ${modeGuidance}
- Avoid lengthy explanations or textbook-style paragraphs
- For main_content, use HTML tags: <h2>, <h3>, <ul>, <li>, <table>, <tr>, <td>, <th> only
- Do NOT use <p>, <br>, or other HTML tags

CONTEXT:
Subject: ${params.subject}
Class Level: ${params.classLevel}
Week: ${params.week}
${params.term ? `Term: ${params.term}` : ''}
Duration: ${params.duration}
Learning Level: ${params.learningLevel}
Curriculum Style: ${params.curriculumStyle}
${params.additionalInstructions ? `Special Instructions: ${params.additionalInstructions}` : ''}

Generate the JSON immediately. Return VALID, COMPLETE JSON only.`;
};

const cleanJsonText = (raw: string) => {
  let text = raw.trim();

  // Strip markdown code fences if present.
  text = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, '$1');
  text = text.replace(/^`\s*([\s\S]*?)\s*`$/m, '$1');

  // Remove prepended labels like "JSON:" or "Result:".
  text = text.replace(/^[A-Za-z ]+:\s*/, '');

  // If the entire content is quoted as a string, unquote it.
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }

  return text;
};

const parseJson = (raw: string) => {
  const text = cleanJsonText(raw);

  try {
    return JSON.parse(text);
  } catch (firstError) {
    const match = text.match(/\{[\s\S]*\}$/);
    if (!match) {
      throw new Error(`AI response was not valid JSON. Raw response: ${JSON.stringify(text)}`);
    }
    try {
      return JSON.parse(match[0]);
    } catch (secondError) {
      throw new Error(`AI response was not valid JSON. Extracted payload: ${JSON.stringify(match[0])}`);
    }
  }
};

const isRetryableGeminiError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const maybeStatus = (error as any).status;
  const maybeMessage = String((error as any).message || '').toLowerCase();
  return (
    maybeStatus === 404 ||
    maybeStatus === 429 ||
    maybeStatus === 503 ||
    maybeMessage.includes('404') ||
    maybeMessage.includes('not found') ||
    maybeMessage.includes('unknown model') ||
    maybeMessage.includes('model not found') ||
    maybeMessage.includes('quota exceeded') ||
    maybeMessage.includes('rate limit') ||
    maybeMessage.includes('exceeded your current quota') ||
    maybeMessage.includes('503') ||
    maybeMessage.includes('high demand') ||
    maybeMessage.includes('temporarily unavailable') ||
    maybeMessage.includes('service unavailable')
  );
};

const modelCandidates = configuredModel
  ? [configuredModel, ...fallbackModels.filter((model) => model !== configuredModel)]
  : fallbackModels;

const generateWithModel = async (
  modelName: string,
  params: AiLessonGenerationRequest,
): Promise<AiGeneratedLessonNote> => {
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 4500,
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          objectives: { type: SchemaType.STRING },
          materials: { type: SchemaType.STRING },
          introduction: { type: SchemaType.STRING },
          teachers_presentation: { type: SchemaType.STRING },
          main_content: { type: SchemaType.STRING },
          evaluation: { type: SchemaType.STRING },
          assignment: { type: SchemaType.STRING },
        },
        required: [
          'objectives',
          'materials',
          'introduction',
          'teachers_presentation',
          'main_content',
          'evaluation',
          'assignment',
        ],
      },
    },
  });

  const prompt = createPrompt(params);
  const response = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction:
      'You are an educational assistant. Return ONLY valid JSON matching the schema. Do not add any text before or after the JSON.',
  });

  const rawText = response.response.text();
  const finishReason = response.response.candidates?.[0]?.finishReason;
  
  // Detect truncation before attempting to parse
  const isTruncated = finishReason === 'MAX_TOKENS';
  
  let parsed: any;
  try {
    parsed = parseJson(rawText);
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('Gemini JSON parse error:', {
        model: modelName,
        finishReason,
        rawTextLength: rawText.length,
        error: error.message,
      });
    }
    if (isTruncated) {
      throw new Error(
        'Lesson note was too long and got cut off. Try using shorter content, or the system will generate more concisely next time.',
      );
    }
    throw error;
  }

  if (
    !parsed ||
    typeof parsed.objectives !== 'string' ||
    typeof parsed.materials !== 'string' ||
    typeof parsed.introduction !== 'string' ||
    typeof parsed.teachers_presentation !== 'string' ||
    typeof parsed.main_content !== 'string' ||
    typeof parsed.evaluation !== 'string' ||
    typeof parsed.assignment !== 'string'
  ) {
    throw new Error('AI response did not include all the required lesson note fields.');
  }

  return {
    objectives: parsed.objectives.trim(),
    materials: parsed.materials.trim(),
    introduction: parsed.introduction.trim(),
    teachers_presentation: parsed.teachers_presentation.trim(),
    main_content: parsed.main_content.trim(),
    evaluation: parsed.evaluation.trim(),
    assignment: parsed.assignment.trim(),
  };
};

// Retry wrapper for a single model with exponential backoff
const generateWithRetry = async (
  modelName: string,
  params: AiLessonGenerationRequest,
  maxRetries: number = 2,
): Promise<AiGeneratedLessonNote> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateWithModel(modelName, params);
    } catch (error: unknown) {
      lastError = error;
      
      // If not retryable or this was the last attempt, throw
      if (!isRetryableGeminiError(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Determine if this is a 503 overload error
      const maybeStatus = (error as any).status;
      const maybeMessage = String((error as any).message || '').toLowerCase();
      const is503 = maybeStatus === 503 || maybeMessage.includes('high demand');
      
      // Log the retry attempt
      if (import.meta.env.DEV) {
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} for model "${modelName}"`, {
          is503,
          status: maybeStatus,
          message: (error as any).message,
        });
      }
      
      // Wait before retrying: 3s for first retry, 5s for second
      const backoffMs = attempt === 0 ? 3000 : 5000;
      await sleep(backoffMs);
    }
  }
  
  throw lastError;
};

export const generateLessonNote = async (
  params: AiLessonGenerationRequest,
): Promise<AiGeneratedLessonNote> => {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Set VITE_GEMINI_API_KEY.');
  }

  let lastError: unknown;
  for (const candidate of modelCandidates) {
    try {
      return await generateWithRetry(candidate, params);
    } catch (error: unknown) {
      if (!isRetryableGeminiError(error)) {
        throw error;
      }
      lastError = error;
      console.warn(`Gemini model "${candidate}" failed after retries. Trying next fallback model.`, error);
    }
  }

  throw new Error(
    `AI generation service is temporarily unavailable. Please try again in a few moments. ${
      (lastError as any)?.message ?? ''
    }`,
  );
};
