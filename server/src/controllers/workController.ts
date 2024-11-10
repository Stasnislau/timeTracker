import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Put,
  Query,
} from "@nestjs/common";
import { WorkService } from "../services/workService";
import { WorkEntryDTO } from "../../dto/workEntryDto";
import { WorkEntry } from "@prisma/client";
@Controller("work")
export class WorkController {
  constructor(private workService: WorkService) {}

  @Get("all")
  async getAllWorkEntries() {
    return this.workService.getAllWorkEntries();
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
}
