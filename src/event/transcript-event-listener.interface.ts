import { TranscriptCreatedEvent } from "./transcript-created.event.js";
import { TranscriptUpdatedEvent } from "./transcript-updated.event.js";

export interface ITranscriptEventListener {
    handleTranscriptCreatedEvent(event: TranscriptCreatedEvent): Promise<void>;
    handleTranscriptUpdatedEvent(event: TranscriptUpdatedEvent): Promise<void>;
}
