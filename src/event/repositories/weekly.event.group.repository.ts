import { EntityRepository } from "typeorm";
import { CommonRepository } from "../../common/repositories/common.repository";
import { Helper } from "../../common/utilities/Helper";
import { Condition } from "../../common/utilities/QueryBuilder/Condition";
import { ConditionGroup } from "../../common/utilities/QueryBuilder/ConditionGroup";
import { FilterInfo } from "../../common/utilities/QueryBuilder/FilterInfo";
import { QueryStringProcessor } from "../../common/utilities/QueryStringProcessor";
import { Team } from "../../team/entities/team.entity";
import { IUserFilter } from "../../user/utilities/user-filter.interface";
import { Event } from "../entities/event.entity";

@EntityRepository(Event)
export class WeeklyEventGroupRepository extends CommonRepository<Event> {
  public list = async (queryStringProcessor: QueryStringProcessor, filter: IUserFilter) => {
    const select = ["id", "name", "banner", "avatar", "sport", "ageRange", "level"];

    const joins = [];

    const queryConditions = [new Condition("teams.deleted = 0")];

    if (queryStringProcessor.getSearch()) {
      const conditionGroup = this.getSearchConditionGroup("teams", queryStringProcessor.getSearch());

      queryConditions.push(new Condition(conditionGroup));
    }

    const filterInfo = new FilterInfo(new ConditionGroup(queryConditions));

    const countSelect = ["COUNT(teams.id) AS total"];
    const { total } = await this.getEntitySelect(countSelect, joins, filterInfo).getRawOne();

    const paginationResult = queryStringProcessor.getPaginationResponse(parseInt(total));

    const sort = this.getSortObject(select, queryStringProcessor);

    if (Helper.isDefined(sort)) {
      filterInfo.sort = sort;
    }

    const results = await this.entitySelect(
      select,
      joins,
      filterInfo,
      queryStringProcessor.getOffset(),
      queryStringProcessor.getLimit()
    );

    return {
      pagination: paginationResult,
      page: results,
    };
  };

  public deleteById(id: number) {
    return this.createQueryBuilder().update(Team).set({ tsDeleted: new Date() }).where("id = :id", { id }).execute();
  }
}
