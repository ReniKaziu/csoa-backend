import { Request, Response } from "express";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { Helper } from "../../common/utilities/Helper";
import { HttpStatusCode } from "../../common/utilities/HttpStatusCodes";
import { SuccessResponse } from "../../common/utilities/SuccessResponse";
import { EventService } from "../../event/services/event.services";
import { ReviewService } from "../services/review.services";

export class ReviewController {
  static listOppositeTeamPlayers = async (
    request: Request,
    response: Response
  ) => {
    try {
      const event = await EventService.findById(+request.params.eventId);
      if (Helper.isDefined(event)) {
        const results = await ReviewService.listOppositeTeamPlayers(
          event,
          request,
          response
        );
        return response
          .status(HttpStatusCode.OK)
          .send(new SuccessResponse({ results }));
      } else {
        response
          .status(HttpStatusCode.NOT_FOUND)
          .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log({ err });
      return response
        .status(404)
        .send(new ErrorResponse("Could not get possible users for event"));
    }
  };

  static storeReviews = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId);
      const result = await ReviewService.storeReviews(event, request, response);
      response.status(HttpStatusCode.OK).send(new SuccessResponse({ result }));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };
}
