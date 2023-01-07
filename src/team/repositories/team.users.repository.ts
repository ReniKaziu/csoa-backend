import { EntityRepository } from "typeorm";
import { CommonRepository } from "../../common/repositories/common.repository";
import { TeamUsers } from "../entities/team.users.entity";

@EntityRepository(TeamUsers)
export class TeamUsersRepository extends CommonRepository<TeamUsers> {}
