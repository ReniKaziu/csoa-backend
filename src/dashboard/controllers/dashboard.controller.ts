import { Response, Request } from "express";
import { SuccessResponse } from "../../common/utilities/SuccessResponse";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { HttpStatusCode } from "../../common/utilities/HttpStatusCodes";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {
  static getStatistics = async (request: Request, response: Response) => {
    try {
      const results = await DashboardService.getStatistics();
      response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
    } catch (error) {
      console.log({ error });
      return response.status(404).send(new ErrorResponse(error));
    }
  };

  static getStatisticsByComplexId = async (
    request: Request,
    response: Response
  ) => {
    try {
      const results = await DashboardService.getStatisticsByComplexId(
        +request.params.complexId
      );

      response.status(HttpStatusCode.OK).send(new SuccessResponse(results));
    } catch (error) {
      console.log({ error });
      return response.status(404).send(new ErrorResponse(error));
    }
  };
}
