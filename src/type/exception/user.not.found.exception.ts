import { HttpException } from "@/type/exception/http.exception.js";

export class EntityNotFoundException extends HttpException {
  constructor(message: string) {
    super(404, message, "EntityNotFoundException");
  }
}
