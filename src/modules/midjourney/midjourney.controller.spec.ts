import { Test, TestingModule } from '@nestjs/testing';
import { MidjourneyController } from './midjourney.controller';

describe('MidjourneyController', () => {
  let controller: MidjourneyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MidjourneyController],
    }).compile();

    controller = module.get<MidjourneyController>(MidjourneyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
