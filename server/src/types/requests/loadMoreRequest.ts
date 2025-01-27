import { IsDateString, IsOptional, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class LoadMoreDto {
  @IsOptional()
  @IsDateString()
  monthCursor?: string; // Format: "2024-03-01"

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  monthsToLoad?: number = 1;
}
