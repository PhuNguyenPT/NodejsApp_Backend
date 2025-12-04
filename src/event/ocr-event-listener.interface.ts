import { OcrCreatedEvent } from "./ocr-created.event.js";

export interface IOcrEventListener {
    handleOcrCreatedEvent(event: OcrCreatedEvent): Promise<void>;
}
