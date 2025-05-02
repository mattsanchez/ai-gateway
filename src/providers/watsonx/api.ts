import { ProviderAPIConfig } from '../types';
import axios, { AxiosError } from 'axios';

export const WatsonxAPIConfig: ProviderAPIConfig = {
  getBaseURL: ({ providerOptions }) => providerOptions.customHost || process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
  headers: async ({ providerOptions, fn, gatewayRequestBody }) => {
    // IBM Cloud API Key must be exchanged for an access token and then added to each request
    /*
    curl -X POST 'https://iam.cloud.ibm.com/identity/token' -H 'Content-Type: application/x-www-form-urlencoded' -d 'grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=MY_APIKEY'
    {
    "access_token": "eyJhbGciOiJIUz......sgrKIi8hdFs",
    "refresh_token": "not_supported",
    "ims_user_id": 118...90,
    "token_type": "Bearer",
    "expires_in": 3600,
    "expiration": 1473188353,
    "scope": "ibm openid"
    }
    */

    try {
      const tokenRsp = await axios.post(
        'https://iam.cloud.ibm.com/identity/token',
        {
          grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
          apikey: providerOptions.apiKey,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token } = tokenRsp.data;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${access_token}`,
      };
      
      return headers;
    }
    catch (e: any) {
      console.log(`Error getting access token for watsonx: ${e.data.errorDetails}`)
    }
  },
  getEndpoint: ({ fn, providerOptions }) => {
    // Accept watsonx_version in header.
    const version =
      providerOptions?.['watsonxVersion'] ??
      '2024-05-31';

    switch (fn) {
      case 'complete':
        return `/ml/v1/text/generation?version=${version}`;
      case 'chatComplete':
        return `/ml/v1/text/chat?version=${version}`;
      case 'embed':
        return `/ml/v1/text/embeddings?version=${version}`
      default:
        return '';
    }
  },
};
