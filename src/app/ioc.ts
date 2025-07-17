// src/ioc.ts - IoC container for TSOA (optional but recommended)
import { Container } from "typescript-ioc";

import PostService from "@/service/post.service.js";

// Register services in the IoC container
Container.bind(PostService).to(PostService);

export { Container };
