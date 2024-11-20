import { MQ_TOKEN } from '@/common/common.module';
import { config } from '@/common/config';
import { logger, LogLevel } from '@/common/logger';
import { Mq } from '@/common/mq';
import { S3Helpers } from '@/common/s3';
import { getAndEnsureTempDataFolder, sleep } from '@/common/utils';
import { downloadFileTo, splitImage } from '@/common/utils/image';
import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export interface GoApiMidjourneyInput {
  prompt: string;
  process_mode?: string;
  aspect_ratio?: string;
  skip_prompt_check?: boolean;
  credential?: {
    type: string;
    encryptedData: string;
  };
}

export interface GoApiMidjourneyBlendInput {
  images: string[];
  process_mode: string;
  dimension?: string;
  credential?: {
    type: string;
    encryptedData: string;
  };
}

@Injectable()
export class MidjourneyService {
  constructor(@Inject(MQ_TOKEN) private readonly mq: Mq) {}

  private pubMessage(workflowTaskId: string, level: LogLevel, message: string) {
    logger[level]?.(message);
    this.mq.publish(
      workflowTaskId,
      JSON.stringify(
        {
          level,
          message,
          timestamp: Math.floor(Date.now() / 1000),
        },
        null,
        0,
      ),
    );
  }

  private async pollResult(workflowTaskId: string, task_id: string) {
    let finished = false;
    // 四张图汇总在一起的
    let imageUrl = '';
    // Set timeout to 10 minutes
    const timeoutMs = 60 * 10 * 1000;
    const start = +new Date();
    let timeouted = false;
    while (!finished && !timeouted) {
      try {
        const { data: fetchData } = await axios.post(
          'https://api.midjourneyapi.xyz/mj/v2/fetch',
          {
            task_id: task_id,
          },
          {
            headers: {
              'Accept-Encoding': 'gzip, deflate',
            },
          },
        );
        const { status, task_result } = fetchData;
        this.pubMessage(
          workflowTaskId,
          'info',
          `Midjourney task status: ${status}`,
        );
        finished = status === 'finished';
        if (finished) {
          imageUrl = task_result.image_url;
        } else {
          await sleep(500);
        }
      } catch (error) {
        this.pubMessage(
          workflowTaskId,
          'warn',
          `Polling GOAPI midjourney task failed: ${error.message}, retrying...`,
        );
        await sleep(500);
      } finally {
        if (!finished) {
          timeouted = +new Date() - start > timeoutMs;
        }
      }
    }

    if (timeouted) {
      this.pubMessage(
        workflowTaskId,
        'error',
        `Midjourney task timeouted after ${timeoutMs / 1000} seconds`,
      );
      throw new Error(
        `Midjourney task timeouted after ${timeoutMs / 1000} seconds`,
      );
    }

    // 把图切开
    try {
      const tmpFolder = getAndEnsureTempDataFolder();
      const composedImageFile = path.join(tmpFolder, `${task_id}.png`);
      this.pubMessage(workflowTaskId, 'info', `Downloading image ${imageUrl}`);
      await downloadFileTo(imageUrl, composedImageFile);
      this.pubMessage(workflowTaskId, 'info', `Splitting image into 4 pieces`);
      const splitFiles = await splitImage(
        composedImageFile,
        path.join(tmpFolder, task_id),
      );
      const result = await Promise.all(
        splitFiles.map(async (file, index) => {
          this.pubMessage(
            workflowTaskId,
            'info',
            `Uploading file ${index + 1}/${splitFiles.length}: ${file}`,
          );
          const s3Helper = new S3Helpers();
          return await s3Helper.uploadFile(
            fs.readFileSync(file),
            `workflow/artifact/mj/${task_id}/${index}.jpg`,
          );
        }),
      );
      this.pubMessage(
        workflowTaskId,
        'info',
        'Upload files result:' + JSON.stringify(result),
      );
      return result;
    } catch (e) {
      console.error(e);
      this.pubMessage(workflowTaskId, 'info', 'Processing failed:' + e.message);
    }

    return [imageUrl];
  }

  public async generateImageByGoApi(
    workflowTaskId: string,
    inputData: GoApiMidjourneyInput,
  ): Promise<string[]> {
    const {
      prompt,
      process_mode = 'relax',
      aspect_ratio,
      skip_prompt_check = false,
      credential,
    } = inputData;

    let apiKey: string;
    if (credential) {
      const credentialData = JSON.parse(credential.encryptedData);
      apiKey = credentialData.api_key;
    } else {
      if (!config.goapi.apikey) {
        throw new Error('没有配置 GOAPI_KEY，请联系管理员。');
      }
      apiKey = config.goapi.apikey;
    }

    // 第一步：imagine
    try {
      const { data: imagineData } = await axios.post(
        `https://api.midjourneyapi.xyz/mj/v2/imagine`,
        {
          prompt,
          process_mode,
          aspect_ratio,
          skip_prompt_check,
        },
        {
          headers: {
            'X-API-KEY': apiKey,
            'Accept-Encoding': 'gzip, deflate',
          },
        },
      );
      const { task_id } = imagineData;
      this.pubMessage(
        workflowTaskId,
        'info',
        `Created midjourney imagine task with prompt ${prompt}, task_id=${task_id}`,
      );
      return await this.pollResult(workflowTaskId, task_id);
    } catch (error: any) {
      logger.error(error);
      const errMsg = error?.response?.data?.message || error?.message;
      throw new Error('生成图片失败：' + errMsg);
    }
  }

  public async imageBlendByGoApi(
    workflowTaskId: string,
    inputData: GoApiMidjourneyBlendInput,
  ): Promise<string[]> {
    const { images, process_mode = 'relax', dimension, credential } = inputData;
    let apiKey: string;
    if (credential) {
      const credentialData = JSON.parse(credential.encryptedData);
      apiKey = credentialData.api_key;
    } else {
      if (!config.goapi.apikey) {
        throw new Error('没有配置 GOAPI_KEY，请联系管理员。');
      }
      apiKey = config.goapi.apikey;
    }

    try {
      const { data: blendData } = await axios.post(
        `https://api.midjourneyapi.xyz/mj/v2/blend`,
        {
          image_urls: images,
          process_mode,
          dimension,
        },
        {
          headers: {
            'X-API-KEY': apiKey,
            'Accept-Encoding': 'gzip, deflate',
          },
        },
      );
      const { task_id } = blendData;
      this.pubMessage(
        workflowTaskId,
        'info',
        `Created midjourney blend task with prompt ${prompt}, task_id=${task_id}`,
      );
      return await this.pollResult(workflowTaskId, task_id);
    } catch (error: any) {
      logger.error(error);
      const errMsg = error?.response?.data?.message || error?.message;
      throw new Error('生成图片失败：' + errMsg);
    } finally {
      this.pubMessage(workflowTaskId, 'info', '[DONE]');
    }
  }
}
