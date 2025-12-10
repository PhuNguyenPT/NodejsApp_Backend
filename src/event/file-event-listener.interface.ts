import type {
    FilesCreatedEvent,
    SingleFileCreatedEvent,
} from "@/event/file.event.js";

export interface IFileEventListener {
    handleFileCreatedEvent(
        event: FilesCreatedEvent | SingleFileCreatedEvent,
    ): Promise<void>;
}
