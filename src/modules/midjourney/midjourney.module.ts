import { Module } from '@nestjs/common';
import { MidjourneyController } from './midjourney.controller';
import { MidjourneyService } from './midjourney.service';

@Module({
  controllers: [MidjourneyController],
  providers: [MidjourneyService],
})
export class MidjourneyModule {}
