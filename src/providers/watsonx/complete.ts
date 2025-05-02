import {
  CompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import { WATSONX_AI } from '../../globals';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';
import { Params } from '../../types/requestBody';

export const WXCompleteConfig: ProviderConfig = {
  prompt: {
    param: 'input',
    required: true,
  },
  temperature: {
    param: 'temperature',
    default: 0.5,
    min: 0,
    max: 1,
  },
  space_id: {
    param: 'space_id',
  },
  project_id: {
    param: 'project_id',
  },
  max_tokens: {
    param: 'max_tokens',
    default: null,
    min: 1,
  },
  max_new_tokens: {
    param: 'max_tokens',
    default: null,
    min: 1,
  },
  stop: {
    param: 'stop_sequences',
  },
};

export const WXCompleteResponseTransform = (
  response: any,
  params: Params
): CompletionResponse | ErrorResponse => {
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
      id: response.id || `cmpl-${Date.now()}`,
      object: 'text_completion',
      created: response.created || Math.floor(Date.now() / 1000),
      model: response.model || response.model_id || params.model || 'ibm/granite-3-2-8b-instruct',
      choices: response.choices || [],
      usage: response.usage || {}
    };
  } catch (error) {
    console.error('Error transforming watsonx complete response:', error);
    return generateInvalidProviderResponseError(response, WATSONX_AI);
  }
};

export const WXCompleteStreamChunkTransform = (
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

    // For streaming, we need to format the response as an SSE event
    const completionChunk = {
      id: `cmpl-${Date.now()}`,
      object: 'text_completion',
      created: Math.floor(Date.now() / 1000),
      model: params.model || 'ibm/granite-3-2-8b-instruct',
      choices: [
        {
          text: chunk.results?.[0]?.generated_text || '',
          index: 0,
          logprobs: null,
          finish_reason: chunk.results?.[0]?.stop_reason || null,
        },
      ],
    };

    return `data: ${JSON.stringify(completionChunk)}\n\n`;
  } catch (error) {
    console.error('Error transforming watsonx complete stream chunk:', error);
    const errorResponse = generateInvalidProviderResponseError(chunk, WATSONX_AI);
    return `data: ${JSON.stringify(errorResponse)}\n\n`;
  }
};
