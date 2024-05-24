import {
  MonkeyToolCategories,
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
} from './midjourney.service';

@Controller('')
@UseGuards(new AuthGuard())
@ApiTags('图像生成')
export class MidjourneyController {
  constructor(private readonly service: MidjourneyService) {}

  @Post('/goapi-midjourney')
  @ApiOperation({
    summary: '文本生成图像（MJ）',
    description: '使用 MidJourney 图片生成',
  })
  @MonkeyToolName('goapi_midjourney')
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:📷:#98ae36')
  @MonkeyToolInput([
    {
      type: 'string',
      name: 'prompt',
      displayName: '关键词（提示词）',
      default: '',
      required: true,
    },
    {
      name: 'process_mode',
      type: 'options',
      displayName: '处理模式',
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
      displayName: '是否调过 Prompt 校验',
      default: false,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'result',
      displayName: '图像 URL 列表',
      type: 'file',
      typeOptions: {
        multipleValues: true,
      },
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 180,
  })
  public async generateImageByGoApi(
    @Req() req: IRequest,
    @Body() body: GoApiMidjourneyInput,
  ) {
    const { taskId } = req;
    const urls = await this.service.generateImageByGoApi(taskId, body);
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
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:📷:#98ae36')
  @MonkeyToolInput([
    {
      name: 'images',
      type: 'file',
      displayName: '图片列表',
      typeOptions: {
        multipleValues: true,
        accept: '.jpg,.jpeg,.png',
        // 文件数量限制
        // multipleValues 为 false 时，下面两个的值不需要填，因为只能为 1
        minValue: 2,
        maxValue: 5,
        maxSize: 1024 * 1024 * 10,
      },
    },
    {
      name: 'process_mode',
      type: 'options',
      displayName: '处理模式',
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
  @MonkeyToolOutput([
    {
      name: 'result',
      displayName: '图像 URL 列表',
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
