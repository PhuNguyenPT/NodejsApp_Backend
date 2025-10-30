import { StudentCreatedEvent } from "./student.event.js";

export interface IStudentEventListener {
    handleStudentCreatedEvent(event: StudentCreatedEvent): Promise<void>;
}
