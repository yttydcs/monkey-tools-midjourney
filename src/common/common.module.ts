import { Global, Module } from '@nestjs/common';
import { EventEmitterMq } from './mq';

export const MQ_TOKEN = 'MQ';

@Global()
@Module({
  providers: [
    {
      provide: MQ_TOKEN,
      useFactory: () => {
        return new EventEmitterMq();
      },
    },
  ],
  imports: [],
  exports: [MQ_TOKEN],
})
export class CommonModule {}
