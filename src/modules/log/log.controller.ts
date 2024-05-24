import { MQ_TOKEN } from '@/common/common.module';
import { Mq } from '@/common/mq';
import { Controller, Get, Inject, Param, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('logs')
export class LogController {
  constructor(@Inject(MQ_TOKEN) private readonly mq: Mq) {}

  @Get(':taskId')
  public async getLog(@Res() res: Response, @Param('taskId') taskId: string) {
    res.setHeader('content-type', 'text/event-stream');
    res.status(201);

    this.mq.subscribe(taskId, (channel, message) => {
      res.write(`data: ${message}\n\n`);
      if (message.startsWith('[DONE]')) {
        res.end();
      }
    });
  }
}
