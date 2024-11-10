import { IsString } from "class-validator";

import { IsBoolean } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class DeleteProjectRequest {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsBoolean()
  @IsNotEmpty()
  shouldDeleteWorkEntries: boolean;
}
