import { Test, TestingModule } from '@nestjs/testing';
import { MidjourneyService } from './midjourney.service';

describe('MidjourneyService', () => {
  let service: MidjourneyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MidjourneyService],
    }).compile();

    service = module.get<MidjourneyService>(MidjourneyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
