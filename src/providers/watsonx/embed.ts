import { ProviderConfig } from '../types';
import { WATSONX_AI } from '../../globals';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';
import { Params } from '../../types/requestBody';

export const WXEmbedConfig: ProviderConfig = {
  model: {
    param: 'model_id',
    required: true,
    default: 'ibm/slate-2-embed',
  },
  input: {
    param: 'inputs',
    required: true,
    transform: (params: Params) => {
      // Handle both string and array inputs
      if (typeof params.prompt === 'string') {
        return [params.prompt];
      }
      return params.prompt;
    },
  },
  space_id: {
    param: 'space_id',
  },
  project_id: {
    param: 'project_id',
  },
};

export const WXEmbedResponseTransform = (response: any, params: Params) => {
  try {
    if (response.error) {
      return generateErrorResponse({
        message: response.error.message || 'Unknown error',
        type: response.error.type || null,
        param: response.error.param || null,
        code: response.error.code || null
      }, WATSONX_AI);
    }

    // Extract embeddings from the response
    const embeddings = response.results?.map((result: any, index: number) => ({
      object: 'embedding',
      embedding: result.embedding,
      index,
    })) || [];

    return {
      object: 'list',
      data: embeddings,
      model: params.model || 'ibm/slate-2-embed',
      usage: {
        prompt_tokens: response.usage?.input_token_count || 0,
        total_tokens: response.usage?.input_token_count || 0,
      },
    };
  } catch (error) {
    console.error('Error transforming watsonx embed response:', error);
    return generateInvalidProviderResponseError(response, WATSONX_AI);
  }
};
