import { IsOptional } from "class-validator";
import { User } from "../../user/entities/user.entity";

export class CreateTeamDto {
  @IsOptional()
  id: number;

  @IsOptional()
  banner: string;

  @IsOptional()
  avatar: string;

  @IsOptional()
  avatarName: string;

  @IsOptional()
  bannerName: string;

  @IsOptional()
  name: string;

  @IsOptional()
  sport: string;

  @IsOptional()
  ageRange: string;

  @IsOptional()
  level: string;

  @IsOptional()
  user: User;

  @IsOptional()
  userId: number;
}
