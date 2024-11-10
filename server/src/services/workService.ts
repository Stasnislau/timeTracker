import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "./prismaService";
import { WorkEntryDTO } from "../../dto/workEntryDto";
import { WorkEntry } from "@prisma/client";
import { BaseResponse } from "src/types/BaseResponse";

@Injectable()
export class WorkService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllWorkEntries(): Promise<BaseResponse<WorkEntry[]>> {
    const workEntries = await this.prisma.workEntry.findMany();
    return {
      success: true,
      payload: workEntries,
    };
  }

  async createWorkEntry(
    workEntry: WorkEntryDTO
  ): Promise<BaseResponse<WorkEntry>> {
    if (workEntry.startTime > workEntry.endTime) {
      throw new BadRequestException(
        "Start time cannot be greater than end time"
      );
    }
    const createdWorkEntry = await this.prisma.workEntry.create({
      data: workEntry,
    });
    return {
      success: true,
      payload: createdWorkEntry,
    };
  }

  async deleteWorkEntry(id: string): Promise<BaseResponse<WorkEntry>> {
    const deletedWorkEntry = await this.prisma.workEntry.delete({
      where: { id },
    });
    return {
      success: true,
      payload: deletedWorkEntry,
    };
  }

  async updateWorkEntry(
    workEntry: WorkEntry
  ): Promise<BaseResponse<WorkEntry>> {
    if (
      workEntry.startTime > workEntry.endTime ||
      new Date(workEntry.startTime) > new Date() ||
      new Date(workEntry.endTime) > new Date()
    ) {
      throw new BadRequestException(
        "Start time cannot be greater than end time or current date"
      );
    }
    const updatedWorkEntry = await this.prisma.workEntry.update({
      where: { id: workEntry.id },
      data: workEntry,
    });
    return {
      success: true,
      payload: updatedWorkEntry,
    };
  }

  async getWorkEntriesByProjectId(
    projectId: string
  ): Promise<BaseResponse<WorkEntry[]>> {
    const workEntries = await this.prisma.workEntry.findMany({
      where: { projectId },
    });
    return {
      success: true,
      payload: workEntries,
    };
  }
}
