import { Controller, Get, Post, Delete, Param, Put } from "@nestjs/common";
import { ProjectService } from "../services/projectService";
import { Project } from "@prisma/client";
import { Body } from "@nestjs/common";
import { DeleteProjectRequest } from "src/types/requests/DeleteProjectRequest";

@Controller("project")
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get("all")
  async getAllProjects() {
    return await this.projectService.getAllProjects();
  }

  @Post("create")
  async createProject(@Body() project: Project) {
    return await this.projectService.createProject(project);
  }

  @Delete("delete")
  async deleteProject(@Body() data: DeleteProjectRequest) {
    return await this.projectService.deleteProject(data);
  }
}
