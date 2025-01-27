import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Put,
  Query,
} from "@nestjs/common";
import { WorkService } from "../services/workService";
import { WorkEntryDTO } from "../../dto/workEntryDto";
import { WorkEntry } from "@prisma/client";
import { LoadMoreDto } from '../types/requests/loadMoreRequest';
import { StatisticsRequest } from "src/types/requests/statisticsRequest";

@Controller("work")
export class WorkController {
  constructor(private workService: WorkService) {}

  @Post("all")
  async getAllWorkEntries(@Body() loadMoreDto: LoadMoreDto) {
    return this.workService.getAllWorkEntries(loadMoreDto);
  }

  @Post("create")
  async createWorkEntry(@Body() workEntry: WorkEntryDTO) {
    return this.workService.createWorkEntry(workEntry);
  }

  @Delete("delete")
  async deleteWorkEntry(@Query("id") id: string) {
    return this.workService.deleteWorkEntry(id);
  }

  @Put("update")
  async updateWorkEntry(@Body() workEntry: WorkEntry) {
    return this.workService.updateWorkEntry(workEntry);
  }

  @Post("statistics")
  async getStatistics(@Body() statisticsRequest: StatisticsRequest) {
    return this.workService.getStatistics(statisticsRequest);
  }

  @Get("years")
  async getAvailableYears() {
    return this.workService.getAvailableYears();
  }
}
