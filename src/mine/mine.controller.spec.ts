import { Test, TestingModule } from '@nestjs/testing';
import { MineController } from './mine.controller';

describe('MineController', () => {
  let controller: MineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MineController],
    }).compile();

    controller = module.get<MineController>(MineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
