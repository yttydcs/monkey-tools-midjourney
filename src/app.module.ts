import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { CommonMiddleware } from './common/middlewares/common.middleware';
import { LogModule } from './modules/log/log.module';
import { MidjourneyModule } from './modules/midjourney/midjourney.module';

@Module({
  imports: [CommonModule, MidjourneyModule, LogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CommonMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
