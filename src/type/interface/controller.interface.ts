// src/type/interface/controller.interface.ts
import { Router } from "express";

interface IController {
  path: string;
  router: Router;
}

export default IController;
