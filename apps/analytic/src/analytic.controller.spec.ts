import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticController } from './analytic.controller';
import { AnalyticService } from './analytic.service';

describe('AnalyticController', () => {
  let analyticController: AnalyticController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticController],
      providers: [AnalyticService],
    }).compile();

    analyticController = app.get<AnalyticController>(AnalyticController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(analyticController.getHello()).toBe('Hello World!');
    });
  });
});
