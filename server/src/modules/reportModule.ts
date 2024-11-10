import { Module } from "@nestjs/common";
import { PrismaService } from "src/services/prismaService";
import { ReportService } from "src/services/reportService";
import { ReportController } from "src/controllers/reportController";

@Module({
  imports: [],
  providers: [ReportService, PrismaService],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
