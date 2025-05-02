import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig
} from '../types';
import { WATSONX_AI } from '../../globals';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';
import { Params } from '../../types/requestBody';

export const WXChatCompleteConfig: ProviderConfig = {
  messages: {
    param: 'messages',
    default: [],
    transform: (params: Params) => {
      return params.messages?.map((message) => {
        if (message.role === 'developer') return { ...message, role: 'system' };
        return message;
      });
    },
  },
  temperature: {
    param: 'temperature',
    default: 0.5,
    min: 0,
    max: 1,
  },
  space_id: {
    param: 'space_id'
  },
  project_id: {
    param: 'project_id'
  },
  max_tokens: {
    param: 'max_tokens',
    default: null,
    min: 1,
  },
  max_completion_tokens: {
    param: 'max_tokens',
    default: null,
    min: 1,
  }
};

export const WXChatCompleteResponseTransform = (
  response: any,
  params: Params
): ChatCompletionResponse | ErrorResponse => {
  try {
    if (response.error) {
      return generateErrorResponse({
        message: response.error.message || 'Unknown error',
        type: response.error.type || null,
        param: response.error.param || null,
        code: response.error.code || null
      }, WATSONX_AI);
    }

    return {
      id: response.id || `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: response.created,
      model: response.model || response.model_id || params.model || 'ibm/granite-3-2-8b-instruct',
      choices: response.choices || [],
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('Error transforming watsonx chat complete response:', error);
    return generateInvalidProviderResponseError(response, WATSONX_AI);
  }
};

interface SSEEvent {
  id: string;
  event: string;
  data: Record<string, any>;
}

function parseSSEEvent(raw: string): SSEEvent {
  const lines = raw.split(/\r?\n/);
  let id = '';
  let event = '';
  let dataBuf = '';

  for (const line of lines) {
    if (line.startsWith('id:')) {
      // everything after "id:"
      id = line.slice(3).trim();
    } else if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      // accumulate in case "data:" appears multiple times
      dataBuf += line.slice(5).trim();
    }
  }

  let data: Record<string, any>;
  try {
    data = JSON.parse(dataBuf);
  } catch (err) {
    throw new Error(`Failed to parse SSE data JSON: ${(err as Error).message}`);
  }

  return { id, event, data };
}

export const WXChatCompleteStreamChunkTransform = (
  chunk: any,
  params: Params
): string => {
  try {
    if (chunk.error) {
      const errorResponse = generateErrorResponse({
        message: chunk.error.message || 'Unknown error',
        type: chunk.error.type || null,
        param: chunk.error.param || null,
        code: chunk.error.code || null
      }, WATSONX_AI);
      return `data: ${JSON.stringify(errorResponse)}\n\n`;
    }

    const { id, event, data } = parseSSEEvent(chunk)

    // For streaming, we need to format the response as an SSE event with just a data: section to keep it clean
    const completionChunk = {
      id: data.id || `chatcmpl-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: data.created,
      created_at: data.created_at,
      model: data.model_id || data.model || 'ibm/granite-3-2-8b-instruct',
      model_version: data.model_version,
      choices: data.choices || [],
      usage: data.usage
    };

    return `data: ${JSON.stringify(completionChunk)}\n\n`;
  } catch (error) {
    console.error('Error transforming watsonx chat complete stream chunk:', error);
    const errorResponse = generateInvalidProviderResponseError(chunk, WATSONX_AI);
    return `data: ${JSON.stringify(errorResponse)}\n\n`;
  }
};
