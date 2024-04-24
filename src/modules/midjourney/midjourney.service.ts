import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { S3Helpers } from '@/common/s3';
import { getAndEnsureTempDataFolder, sleep } from '@/common/utils';
import { downloadFileTo, splitImage } from '@/common/utils/image';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export interface GoApiMidjourneyInput {
  prompt: string;
  process_mode?: string;
  aspect_ratio?: string;
  skip_prompt_check?: boolean;
}

export interface GoApiMidjourneyBlendInput {
  images: string[];
  process_mode: string;
  dimension?: string;
}

@Injectable()
export class MidjourneyService {
  private async pollResult(task_id: string) {
    let finished = false;
    // 四张图汇总在一起的
    let imageUrl = '';
    while (!finished) {
      const { data: fetchData } = await axios.post(
        'https://api.midjourneyapi.xyz/mj/v2/fetch',
        {
          task_id: task_id,
        },
      );
      const { status, task_result } = fetchData;
      logger.info('GOAPI midjourney task status:', task_id, status);
      finished = status === 'finished';
      if (finished) {
        imageUrl = task_result.image_url;
      } else {
        await sleep(500);
      }
    }

    // 把图切开
    const tmpFolder = getAndEnsureTempDataFolder();
    const composedImageFile = path.join(tmpFolder, `${task_id}.png`);
    await downloadFileTo(imageUrl, composedImageFile);
    const splitedFiles = await splitImage(
      composedImageFile,
      path.join(tmpFolder, task_id),
    );
    const result = await Promise.all(
      splitedFiles.map(async (file, index) => {
        logger.info('Start to upload file:', file);
        const s3Helper = new S3Helpers();
        const url = await s3Helper.uploadFile(
          fs.readFileSync(file),
          `workflow/artifact/mj/${task_id}/${index}.jpg`,
        );
        return url;
      }),
    );
    logger.info('Upload files result:', result);
    return result;
  }

  public async generateImageByGoApi(
    inputData: GoApiMidjourneyInput,
  ): Promise<string[]> {
    const {
      prompt,
      process_mode = 'relax',
      aspect_ratio,
      skip_prompt_check = false,
    } = inputData;
    if (!config.goapi.apikey) {
      throw new Error('没有配置 GOAPI_KEY，请联系管理员。');
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
            'X-API-KEY': config.goapi.apikey,
          },
        },
      );
      const { task_id } = imagineData;
      return await this.pollResult(task_id);
    } catch (error: any) {
      logger.error(error);
      const errMsg = error?.response?.data?.message || error?.message;
      throw new Error('生成图片失败：' + errMsg);
    }
  }

  public async imageBlendByGoApi(
    inputData: GoApiMidjourneyBlendInput,
  ): Promise<string[]> {
    const { images, process_mode = 'relax', dimension } = inputData;
    if (!config.goapi.apikey) {
      throw new Error('没有配置 GOAPI_KEY，请联系管理员。');
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
            'X-API-KEY': config.goapi.apikey,
          },
        },
      );
      const { task_id } = blendData;
      return await this.pollResult(task_id);
    } catch (error: any) {
      logger.error(error);
      const errMsg = error?.response?.data?.message || error?.message;
      throw new Error('生成图片失败：' + errMsg);
    }
  }
}
