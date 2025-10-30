import { AuthConfig, AuthType } from '../typings/manifest';
import { getHostFromUrl } from '../utils';
import { readConfig } from './readYaml';

export interface ServerConfig {
  port: number;
  auth: AuthConfig;
  appUrl: string;
}

export interface RedisConfig {
  url: string;
  prefix: string;
}

export interface GoApiConfig {
  baseUrl?: string;
  apikey: string;
  timeout?: number;
}

export interface YouchuanConfig {
  baseUrl?: string;
  appId: string;
  secret: string;
  timeout?: number;
}

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
  modelBucketName: string;
  bucket: string;
  publicAccessUrl: string;
  forcePathStyle: boolean;
}

export interface ProxyConfig {
  enabled: boolean;
  url?: string;
  exclude?: string[];
}

export interface Config {
  server: ServerConfig;
  redis: RedisConfig;
  goapi: GoApiConfig;
  youchuan: YouchuanConfig;
  s3: S3Config;
  proxy: ProxyConfig;
}

const port = readConfig('server.port', 3000);

export const config: Config = {
  server: {
    port,
    auth: {
      type: readConfig('server.auth.type', AuthType.none),
      authorization_type: 'bearer',
      verification_tokens: {
        monkeys: readConfig('server.auth.bearerToken'),
      },
    },
    appUrl: readConfig('server.appUrl', `http://localhost:${port}`),
  },
  redis: {
    url: readConfig('redis.url'),
    prefix: readConfig('redis.prefix', 'monkeys:'),
  },
  goapi: {
    apikey: readConfig('goapi.apikey', ''),
    baseUrl: readConfig('goapi.baseUrl', 'https://api.goapi.ai'),
    timeout: readConfig('goapi.timeout', 60 * 10 * 1000), // 默认10分钟
  },
  youchuan: {
    appId: readConfig('youchuan.appId', ''),
    secret: readConfig('youchuan.secret', ''),
    baseUrl: readConfig('youchuan.baseUrl', 'https://ali.youchuan.cn'),
    timeout: readConfig('youchuan.timeout', 60 * 10 * 1000),
  },
  s3: readConfig('s3', {}),
  proxy: {
    enabled: readConfig('proxy.enabled', false),
    url: readConfig('proxy.url'),
    exclude: readConfig('proxy.exclude', []),
  },
};

const validateConfig = () => {
  if (config.server.auth.type === AuthType.service_http) {
    if (!config.server.auth.verification_tokens['monkeys']) {
      throw new Error(
        'Invalid Config: auth.bearerToken must not empty when auth.type is service_http',
      );
    }
  }

  // if (!config.goapi.apikey) {
  //   throw new Error('Invalid Config: goapi.apikey must not empty');
  // }

  if (config.proxy.enabled) {
    if (!config.proxy.url) {
      throw new Error('Proxy enabled but no url provided');
    }
    if (config.proxy.exclude && !Array.isArray(config.proxy.exclude)) {
      throw new Error('Proxy exclude must be an array');
    }
  }
};

validateConfig();

if (config.proxy.enabled) {
  const { url, exclude } = config.proxy;
  // Exclude localhost from proxy
  exclude.push('localhost');
  exclude.push('127.0.0.1');
  // Exclude s3 from proxy
  exclude.push(getHostFromUrl(config.s3.endpoint));
  exclude.push(getHostFromUrl(config.s3.publicAccessUrl));
  process.env.HTTP_PROXY = url;
  process.env.HTTPS_PROXY = url;
  process.env.http_proxy = url;
  process.env.https_proxy = url;
  process.env.NO_PROXY = exclude.join(',');
}
