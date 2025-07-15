// src/type/interface/controller.interface.ts
import { Router } from "express";

interface Controller {
  path: string;
  router: Router;
}

export default Controller;
