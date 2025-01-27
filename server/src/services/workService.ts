import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "./prismaService";
import { WorkEntryDTO } from "../../dto/workEntryDto";
import { WorkEntry } from "@prisma/client";
import { BaseResponse } from "src/types/BaseResponse";
import { LoadMoreDto } from "../types/requests/loadMoreRequest";
import { LoadMoreResponse } from "../types/LoadMoreResponse";
import {
  startOfMonth,
  subMonths,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInSeconds,
} from "date-fns";
import { StatisticsRequest } from "src/types/requests/statisticsRequest";
import { StatisticsItem } from "src/models/statisticsItem";
@Injectable()
export class WorkService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllWorkEntries(
    loadMoreDto: LoadMoreDto
  ): Promise<LoadMoreResponse<WorkEntry>> {
    const { monthCursor, monthsToLoad = 1 } = loadMoreDto;
    const startDate = monthCursor
      ? startOfMonth(new Date(monthCursor))
      : startOfMonth(new Date());

    const endDate = endOfMonth(subMonths(startDate, monthsToLoad - 1));

    const items = await this.prisma.workEntry.findMany({
      where: {
        startTime: {
          gte: startDate,
        },
        endTime: {
          lte: endDate,
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    const nextCursor = subMonths(endDate, 1).toISOString();

    const hasMore = await this.prisma.workEntry
      .findFirst({
        where: {
          startTime: {
            lt: endDate,
          },
        },
      })
      .then((entry) => !!entry);

    return {
      success: true,
      payload: {
        items,
        nextCursor: hasMore ? nextCursor : null,
        hasMore,
      },
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

  async getStatistics(
    statisticsRequest: StatisticsRequest
  ): Promise<BaseResponse<StatisticsItem[]>> {
    const { type, month, year, projectId } = statisticsRequest;

    let startDate: Date;
    let endDate: Date;
    let statisticsItems: StatisticsItem[] = [];

    switch (type) {
      case "monthly": {
        startDate = startOfMonth(new Date(year, month - 1));
        endDate = endOfMonth(new Date(year, month - 1));

        const daysInMonth = endDate.getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(year, month - 1, day);
          statisticsItems.push({
            date: currentDate.toISOString(),
            totalHours: 0,
            projectId: projectId || "",
          });
        }
        break;
      }

      case "total": {
        const dates = await this.prisma.workEntry.findMany({
          select: { startTime: true },
          distinct: ["startTime"],
        });

        const yearMap = new Map<string, StatisticsItem>();

        dates.forEach((date) => {
          const year = date.startTime.getFullYear().toString();
          if (!yearMap.has(year)) {
            yearMap.set(year, {
              date: year,
              totalHours: 0,
              projectId: projectId || "",
            });
          }
        });

        statisticsItems = Array.from(yearMap.values());
        break;
      }

      case "yearly": {
        startDate = startOfYear(new Date(year, 0));
        endDate = endOfYear(new Date(year, 0));

        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const currentDate = new Date(year, monthIndex, 1);
          statisticsItems.push({
            date: currentDate.toISOString(),
            totalHours: 0,
            projectId: projectId || "",
          });
        }
        break;
      }

      default:
        throw new BadRequestException("Invalid statistics type");
    }

    const workEntries = await this.prisma.workEntry.findMany({
      where: {
        startTime: { gte: startDate },
        endTime: { lte: endDate },
        ...(projectId && { projectId }),
      },
      orderBy: {
        startTime: "asc",
      },
    });

    workEntries.forEach((entry) => {
      const entryHours =
        differenceInSeconds(entry.endTime, entry.startTime) / 60 / 60;

      switch (type) {
        case "monthly": {
          const dayIndex = entry.startTime.getDate() - 1;
          statisticsItems[dayIndex].totalHours += entryHours;
          break;
        }

        case "yearly": {
          const monthIndex = entry.startTime.getMonth();
          statisticsItems[monthIndex].totalHours += entryHours;
          break;
        }
        case "total": {
          const year = entry.startTime.getFullYear().toString();
          const yearItem = statisticsItems.find((item) => item.date === year);
          if (yearItem) {
            yearItem.totalHours += entryHours;
          }
          break;
        }
      }
    });
    return {
      success: true,
      payload: statisticsItems,
    };
  }

  async getAvailableYears(): Promise<BaseResponse<string[]>> {
    const availableYears = await this.prisma.workEntry.findMany({
      select: { startTime: true },
      distinct: ["startTime"],
    });
    const uniqueYears = [
      ...new Set(availableYears.map((entry) => entry.startTime.getFullYear())),
    ];
    return {
      success: true,
      payload: uniqueYears.map((year) => year.toString()),
    };
  }
}
