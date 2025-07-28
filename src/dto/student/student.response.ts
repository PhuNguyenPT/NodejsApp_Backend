import { AwardDTO } from "./award";
import { BudgetDTO } from "./budget";
import { CertificationDTO } from "./certification";

export class StudentResponse {
    awards?: AwardDTO[];
    budget!: BudgetDTO;
    certifications?: CertificationDTO[];
    location!: string;
    major!: string;
}
