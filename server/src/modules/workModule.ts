import { Module } from '@nestjs/common';
import { WorkService } from '../services/workService';
import { WorkController } from '../controllers/workController';
import { PrismaService } from '../services/prismaService';

@Module({
  imports: [],
  providers: [WorkService, PrismaService],
  controllers: [WorkController],
  exports: [WorkService],
})
export class WorkModule {}
