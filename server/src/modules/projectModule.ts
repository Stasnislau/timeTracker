import { Module } from "@nestjs/common";
import { ProjectService } from "../services/projectService";
import { ProjectController } from "src/controllers/projectController";
import { PrismaService } from "src/services/prismaService";

@Module({
  imports: [],
  providers: [ProjectService, PrismaService],
  controllers: [ProjectController],
  exports: [ProjectService],
})
export class ProjectModule {}
