import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "./prismaService";
import { Project } from "@prisma/client";
import { BaseResponse } from "src/types/BaseResponse";
import { ProjectDTO } from "dto/projectDto";
import { DeleteProjectRequest } from "src/types/requests/DeleteProjectRequest";
@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProjects(): Promise<BaseResponse<Project[]>> {
    const projects = await this.prisma.project.findMany();

    return {
      success: true,
      payload: projects,
    };
  }

  async createProject(project: ProjectDTO): Promise<BaseResponse<Project>> {
    const ifProjectExists = await this.prisma.project.findFirst({
      where: { name: project.name },
    });
    if (ifProjectExists) {
      throw new BadRequestException("Project already exists");
    }
    const createdProject = await this.prisma.project.create({
      data: project,
    });
    if (!createdProject) {
      throw new InternalServerErrorException("Failed to create project");
    }
    return {
      success: true,
      payload: createdProject,
    };
  }

  async deleteProject(
    data: DeleteProjectRequest
  ): Promise<BaseResponse<Project>> {
    const { id, shouldDeleteWorkEntries } = data;
    const defaultProjectId = await this.prisma.project.findFirst({
      where: { name: "@Default" },
    });
    if (!defaultProjectId) {
      throw new Error("Default project not found");
    }
    if (id === defaultProjectId?.id) {
      throw new Error("Default project cannot be deleted");
    }
    const deletedProject = await this.prisma.$transaction(async (tx) => {
      const projectToDelete = await tx.project.findUnique({ where: { id } });
      if (!projectToDelete) {
        throw new BadRequestException("Project not found");
      }
      if (shouldDeleteWorkEntries) {
        await tx.workEntry.deleteMany({ where: { projectId: id } });
      } else {
        await tx.workEntry.updateMany({
          where: { projectId: id },
          data: { projectId: defaultProjectId?.id },
        });
      }
      return tx.project.delete({ where: { id } });
    });
    return {
      success: true,
      payload: deletedProject,
    };
  }
}
