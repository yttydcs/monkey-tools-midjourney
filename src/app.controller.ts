import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { config } from './common/config';
import {
  ApiType,
  CredentialAuthType,
  ManifestJson,
  SchemaVersion,
} from './common/typings/manifest';

@Controller()
export class AppController {
  constructor() {}

  @Get('/healthz')
  public async healthz() {
    return {
      status: 'OK',
    };
  }

  @Get('/manifest.json')
  @ApiExcludeEndpoint()
  public getManifestJson(): ManifestJson {
    return {
      schema_version: SchemaVersion.v1,
      display_name: 'MidJourney',
      namespace: 'midjourney',
      auth: config.server.auth,
      api: {
        type: ApiType.openapi,
        url: `/openapi-json`,
      },
      contact_email: 'dev@inf-monkeys.com',
      logEndpoint: '/logs/{taskId}',
      credentials: [
        {
          name: 'goapi',
          type: CredentialAuthType.AKSK,
          displayName: 'displayName',
          // @ts-ignore
          iconUrl: 'https://www.goapi.ai/logo.png',
          properties: [
            {
              displayName:
                '从 [GoAPI](https://www.goapi.ai/midjourney-api) 获取你的 API Key。',
              type: 'notice',
              name: 'docs',
            },
            {
              displayName: 'API Key',
              type: 'string',
              name: 'api_key',
              required: true,
            },
          ],
        },
      ],
    };
  }
}
