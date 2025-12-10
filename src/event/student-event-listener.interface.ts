import { StudentCreatedEvent } from "@/event/student.event.js";

export interface IStudentEventListener {
    handleStudentCreatedEvent(event: StudentCreatedEvent): Promise<void>;
}
