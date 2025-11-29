import { OcrCreatedEvent } from "./ocr-created.event.js";

export interface IOcrEventListener {
    handleStudentCreatedEvent(event: OcrCreatedEvent): Promise<void>;
}
