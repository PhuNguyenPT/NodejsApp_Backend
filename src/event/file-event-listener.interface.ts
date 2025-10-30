import { FilesCreatedEvent, SingleFileCreatedEvent } from "./file.event.js";

export interface IFileEventListener {
    handleFileCreatedEvent(
        event: FilesCreatedEvent | SingleFileCreatedEvent,
    ): Promise<void>;
}
