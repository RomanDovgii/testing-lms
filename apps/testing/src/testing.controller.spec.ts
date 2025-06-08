import { Test, TestingModule } from '@nestjs/testing';
import { TestingController } from './testing.controller';
import { TestingService } from './testing.service';

describe('TestingController', () => {
  let testingController: TestingController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TestingController],
      providers: [TestingService],
    }).compile();

    testingController = app.get<TestingController>(TestingController);
  });
});
