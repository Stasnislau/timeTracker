import { Module, OnModuleInit } from "@nestjs/common";
import { WorkModule } from "./modules/workModule";
import { PrismaService } from "./services/prismaService";
import { ProjectModule } from "./modules/projectModule";
import { ReportModule } from "./modules/reportModule";

@Module({
  imports: [WorkModule, ProjectModule, ReportModule],
  providers: [PrismaService],
})
export class AppModule implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const defaultProject = await this.prisma.project.findFirst({
      where: {
        name: "@Default",
      },
    });

    if (!defaultProject) {
      await this.prisma.project.create({
        data: {
          name: "@Default",
        },
      });
      console.log("Default project has been created on startup");
    }
  }
}
