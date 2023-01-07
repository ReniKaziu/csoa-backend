import { IsOptional } from "class-validator";

export class CreateEventDto {
  @IsOptional()
  id?: number;

  @IsOptional()
  sport: string;

  @IsOptional()
  startDate: Date;

  @IsOptional()
  endDate: Date;

  @IsOptional()
  isDraft: boolean;

  @IsOptional()
  isPublic: boolean;

  @IsOptional()
  name: string;

  @IsOptional()
  notes: string;

  @IsOptional()
  phoneNumber: string;

  @IsOptional()
  weeklyGroupedId: number;

  @IsOptional()
  organiserTeamId: number;

  @IsOptional()
  receiverTeamId: number;

  @IsOptional()
  isTeam: boolean;

  @IsOptional()
  level: string;

  @IsOptional()
  playersNumber: string;

  @IsOptional()
  playersAge: string;

  @IsOptional()
  status: string;

  @IsOptional()
  isWeekly: boolean;

  @IsOptional()
  isDraw: boolean;

  @IsOptional()
  result: string;

  @IsOptional()
  lineups: string;

  @IsOptional()
  creatorId: number;

  @IsOptional()
  locationId: number;

  @IsOptional()
  isUserReservation: boolean;

  @IsOptional()
  organiserPhone: boolean;
}
