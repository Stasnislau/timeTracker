import { IsDateString, IsNotEmpty, IsUUID } from "class-validator";

export class WorkEntryDTO {
  @IsDateString()
  @IsNotEmpty()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}
