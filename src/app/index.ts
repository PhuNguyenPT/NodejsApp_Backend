// src/app/index.ts
import validateEnv from "util/validate.env.js";

import App from "@/app/app.js";
import PostController from "@/controller/post.controller.js";

console.log("Port: ", process.env.PORT);
validateEnv();

const app = new App([new PostController()], Number(process.env.PORT));

app.listen();
