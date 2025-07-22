import { injectable } from "inversify";
import { Controller, Route, Tags } from "tsoa";

@injectable()
@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {}
