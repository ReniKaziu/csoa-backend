import { IsOptional } from "class-validator";

export class CreateUserDto {
  @IsOptional()
  id: number;

  @IsOptional()
  name: string;

  @IsOptional()
  profilePicture?: string;

  @IsOptional()
  sex: string;

  @IsOptional()
  phoneNumber: string;

  @IsOptional()
  address: string;

  @IsOptional()
  birthday: Date;

  @IsOptional()
  sports: string;

  @IsOptional()
  pushToken: string;
}
