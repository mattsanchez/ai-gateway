import { ProviderConfigs } from '../types';
import { WatsonxAPIConfig } from './api';
import {
  WXChatCompleteConfig,
  WXChatCompleteResponseTransform,
  WXChatCompleteStreamChunkTransform,
} from './chatComplete';
import {
  WXCompleteConfig,
  WXCompleteResponseTransform,
  WXCompleteStreamChunkTransform,
} from './complete';
import { WXEmbedConfig, WXEmbedResponseTransform } from './embed';
import {
  chatCompleteParams,
  completeParams,
  embedParams,
  responseTransformers,
} from '../open-ai-base';

const WatsonxConfig: ProviderConfigs = {
  complete: completeParams([], {}, WXCompleteConfig),
  chatComplete: chatCompleteParams(
    [],
    { model: 'ibm/granite-3-2-8b-instruct' },
    WXChatCompleteConfig
  ),
  embed: embedParams([], {}, WXEmbedConfig),
  api: WatsonxAPIConfig,
  responseTransforms: {
    'stream-complete': WXCompleteStreamChunkTransform,
    // complete: WXCompleteResponseTransform,
    chatComplete: WXChatCompleteResponseTransform,
    // 'stream-chatComplete': WXChatCompleteStreamChunkTransform,
    embed: WXEmbedResponseTransform,
  },
};

export default WatsonxConfig;
