import type { ChatMessage, ModelProviderConfig, ModelResponse } from '../../types/benchmark';

export class ModelAdapterError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ModelAdapterError';
  }
}

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const buildHeaders = (apiKey: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }

  return headers;
};

const explainFetchFailure = (error: unknown): string => {
  if (error instanceof TypeError) {
    return [
      'The request could not reach the configured endpoint.',
      'This is often caused by CORS restrictions, a wrong base URL, a local server that is not running, or a network failure.',
    ].join(' ');
  }

  return error instanceof Error ? error.message : 'Unknown model request failure.';
};

export async function callOpenAICompatibleChat(
  config: ModelProviderConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<ModelResponse> {
  const started = performance.now();
  const endpoint = `${normalizeBaseUrl(config.baseUrl)}/chat/completions`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: buildHeaders(config.apiKey),
      signal,
      body: JSON.stringify({
        model: config.modelName,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });
  } catch (error) {
    throw new ModelAdapterError(explainFetchFailure(error));
  }

  const rawText = await response.text();
  let parsed: unknown;

  try {
    parsed = rawText ? JSON.parse(rawText) : undefined;
  } catch {
    parsed = undefined;
  }

  if (!response.ok) {
    const messageFromApi =
      typeof parsed === 'object' &&
      parsed !== null &&
      'error' in parsed &&
      typeof parsed.error === 'object' &&
      parsed.error !== null &&
      'message' in parsed.error &&
      typeof parsed.error.message === 'string'
        ? parsed.error.message
        : rawText;

    const fallback =
      response.status === 401 || response.status === 403
        ? 'Authentication failed. Check your API key and endpoint permissions.'
        : response.status === 429
          ? 'The provider rate-limited the request. Try a smaller run or wait before retrying.'
          : response.status === 404
            ? 'Endpoint not found. Confirm the base URL supports /chat/completions.'
            : 'The provider returned an error.';

    throw new ModelAdapterError(messageFromApi || fallback, response.status);
  }

  const content = extractAssistantMessage(parsed);
  if (!content) {
    throw new ModelAdapterError('The provider response did not include an assistant message.');
  }

  return {
    content,
    latency: Math.round(performance.now() - started),
  };
}

export async function testOpenAICompatibleConfig(
  config: ModelProviderConfig,
  signal?: AbortSignal,
): Promise<ModelResponse> {
  return callOpenAICompatibleChat(
    config,
    [
      {
        role: 'system',
        content: 'You are a concise API smoke test responder.',
      },
      {
        role: 'user',
        content: 'Reply with exactly: FRCBench test ok',
      },
    ],
    signal,
  );
}

function extractAssistantMessage(payload: unknown): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'choices' in payload &&
    Array.isArray(payload.choices)
  ) {
    const firstChoice = payload.choices[0] as unknown;
    if (
      typeof firstChoice === 'object' &&
      firstChoice !== null &&
      'message' in firstChoice &&
      typeof firstChoice.message === 'object' &&
      firstChoice.message !== null &&
      'content' in firstChoice.message &&
      typeof firstChoice.message.content === 'string'
    ) {
      return firstChoice.message.content.trim();
    }
  }

  return '';
}
