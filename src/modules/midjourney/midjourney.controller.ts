import { config } from '@/common/config';
import {
  MonkeyToolCategories,
  MonkeyToolCredentials,
  MonkeyToolDescription,
  MonkeyToolDisplayName,
  MonkeyToolExtra,
  MonkeyToolIcon,
  MonkeyToolInput,
  MonkeyToolName,
  MonkeyToolOutput,
} from '@/common/decorators/monkey-block-api-extensions.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  GoApiMidjourneyBlendInput,
  GoApiMidjourneyInput,
  MidjourneyService,
  YouchuanMidjourneyInput,
} from './midjourney.service';

@Controller('')
@UseGuards(new AuthGuard())
@ApiTags('图像生成')
export class MidjourneyController {
  constructor(private readonly service: MidjourneyService) { }

  @Post('/goapi-midjourney')
  @ApiOperation({
    summary: '文本生成图像（MJ）',
    description: '使用 MidJourney 图片生成',
  })
  @MonkeyToolName('goapi_midjourney')
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:📷:#98ae36')
  @MonkeyToolDisplayName({
    'zh-CN': '文本生成图像（MJ）',
    'en-US': 'Text to Image (MJ)',
  })
  @MonkeyToolInput([
    {
      type: 'string',
      name: 'prompt',
      displayName: {
        'zh-CN': '关键词（提示词）',
        'en-US': 'Prompt',
      },
      default: '',
      required: true,
    },
    {
      name: 'process_mode',
      type: 'options',
      displayName: {
        'zh-CN': '处理模式',
        'en-US': 'Process mode',
      },
      default: 'relax',
      options: [
        {
          name: 'relax',
          value: 'relax',
        },
        {
          name: 'mixed',
          value: 'mixed',
        },
        {
          name: 'fast',
          value: 'fast',
        },
        {
          name: 'turbo',
          value: 'turbo',
        },
      ],
    },
    {
      name: 'aspect_ratio',
      type: 'string',
      displayName: 'Aspect ratio',
      default: '1:1',
    },
    {
      name: 'skip_prompt_check',
      type: 'boolean',
      displayName: {
        'zh-CN': '是否跳过 Prompt 校验',
        'en-US': 'Skip prompt check',
      },
      default: false,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'result',
      displayName: {
        'zh-CN': '图像 URL 列表',
        'en-US': 'Image URL list',
      },
      type: 'file',
      typeOptions: {
        multipleValues: true,
      },
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 180,
  })
  @MonkeyToolCredentials([
    {
      name: 'goapi',
      required: config.goapi.apikey ? false : true,
    },
  ])
  public async generateImageByGoApi(
    @Req() req: IRequest,
    @Body() body: GoApiMidjourneyInput,
  ) {
    const { taskId } = req;
    console.log(body);
    const urls = await this.service.generateImageByGoApi(taskId, body);
    return {
      result: urls,
    };
  }

  @Post('/youchuan-midjourney')
  @ApiOperation({
    summary: '文本生成图像（悠船）',
    description: '使用悠船 AI 绘图生成图片。',
  })
  @MonkeyToolName('youchuan_midjourney')
  @MonkeyToolDisplayName({
    'zh-CN': '文本生成图像（悠船）',
    'en-US': 'Text to Image (YouChuan)',
  })
  @MonkeyToolDescription({
    'zh-CN': '调用悠船 AI 绘图服务生成图片。',
    'en-US': 'Generate images via YouChuan diffusion API.',
  })
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:🎨:#5a7ce2')
  @MonkeyToolInput([
    {
      type: 'string',
      name: 'text',
      displayName: {
        'zh-CN': '关键词（提示词）',
        'en-US': 'Prompt',
      },
      default: '',
      required: true,
    },
    {
      type: 'string',
      name: 'callback',
      displayName: {
        'zh-CN': '回调地址（可选）',
        'en-US': 'Callback URL (optional)',
      },
      required: false,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'result',
      displayName: {
        'zh-CN': '图像 URL 列表',
        'en-US': 'Image URL list',
      },
      type: 'file',
      typeOptions: {
        multipleValues: true,
      },
    },
  ])
  @MonkeyToolCredentials([
    {
      name: 'youchuan',
      required:
        config.youchuan.appId && config.youchuan.secret ? false : true,
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 180,
  })
  public async generateImageByYouchuan(
    @Req() req: IRequest,
    @Body() body: YouchuanMidjourneyInput,
  ) {
    const { taskId } = req;
    const urls = await this.service.generateImageByYouchuan(taskId, body);
    return {
      result: urls,
    };
  }

  @Post('/goapi-midjourney-blend')
  @ApiOperation({
    summary: '融图（MJ）',
    description: '使用 MJ 将多张图片合并为一张图片。',
  })
  @MonkeyToolName('goapi_midjourney_blend')
  @MonkeyToolDisplayName({
    'zh-CN': '融图（MJ）',
    'en-US': 'Blend Images (MJ)',
  })
  @MonkeyToolDescription({
    'zh-CN': '使用 MJ 将多张图片合并为一张图片。',
    'en-US': 'Blend multiple images into one image using MJ.',
  })
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:📷:#98ae36')
  @MonkeyToolInput([
    {
      name: 'images',
      type: 'file',
      displayName: {
        'zh-CN': '图片列表',
        'en-US': 'Image List',
      },
      typeOptions: {
        multipleValues: true,
        accept: '.jpg,.jpeg,.png',
        minValue: 2,
        maxValue: 5,
        maxSize: 1024 * 1024 * 10,
      },
    },
    {
      name: 'process_mode',
      type: 'options',
      displayName: {
        'zh-CN': '处理模式',
        'en-US': 'Process mode',
      },
      default: 'relax',
      options: [
        {
          name: 'relax',
          value: 'relax',
        },
        {
          name: 'mixed',
          value: 'mixed',
        },
        {
          name: 'fast',
          value: 'fast',
        },
        {
          name: 'turbo',
          value: 'turbo',
        },
      ],
    },
    {
      name: 'dimension',
      type: 'options',
      displayName: 'dimension',
      required: false,
      options: [
        {
          name: 'square',
          value: 'square',
        },
        {
          name: 'portrait',
          value: 'portrait',
        },
        {
          name: 'landscape',
          value: 'landscape',
        },
      ],
    },
  ])
  @MonkeyToolCredentials([
    {
      name: 'goapi',
      required: config.goapi.apikey ? false : true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'result',
      displayName: {
        'zh-CN': '图像 URL 列表',
        'en-US': 'Image URL list',
      },
      type: 'file',
      typeOptions: {
        multipleValues: true,
        accept: '.jpg,.jpeg,.png',
        maxSize: 1024 * 1024 * 10,
      },
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 180,
  })
  public async imageBlendByGoApi(
    @Req() req: IRequest,
    @Body() body: GoApiMidjourneyBlendInput,
  ) {
    const { taskId } = req;
    const urls = await this.service.imageBlendByGoApi(taskId, body);
    return {
      result: urls,
    };
  }
}
