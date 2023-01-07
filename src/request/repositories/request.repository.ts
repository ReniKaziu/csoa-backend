import { EntityRepository } from "typeorm";
import { CommonRepository } from "../../common/repositories/common.repository";
import { Request } from "../entities/request.entity";

@EntityRepository(Request)
export class RequestRepository extends CommonRepository<Request> {}
