// Copyright (C) 2024 Roman Dovgii
// This file is part of ProjectName.
//
// ProjectName is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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

  // describe('root', () => {
  //   it('should return "Hello World!"', () => {
  //     expect(analyticController.getHello()).toBe('Hello World!');
  //   });
  // });
});
