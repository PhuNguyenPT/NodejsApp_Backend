import type { TranscriptCreatedEvent } from "@/event/transcript-created.event.js";
import type { TranscriptUpdatedEvent } from "@/event/transcript-updated.event.js";

export interface ITranscriptEventListener {
    handleTranscriptCreatedEvent(event: TranscriptCreatedEvent): Promise<void>;
    handleTranscriptUpdatedEvent(event: TranscriptUpdatedEvent): Promise<void>;
}
