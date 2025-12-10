import type { OcrCreatedEvent } from "@/event/ocr-created.event.js";

export interface IOcrEventListener {
    handleOcrCreatedEvent(event: OcrCreatedEvent): Promise<void>;
}
