// src/config/mistralai.ts

import { Mistral } from "@mistralai/mistralai";

import { config } from "@/util/validate.env.js";

const apiKey: string = config.MISTRAL_API_KEY;
export const mistralClient: Mistral = new Mistral({ apiKey: apiKey });
