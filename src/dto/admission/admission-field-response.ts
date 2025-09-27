import { Expose } from "class-transformer";

import { AdmissionField } from "@/entity/admission.entity.js";

/**
 * Response DTO containing distinct field values for admission filtering.
 * This class provides all unique values for each filterable admission field,
 * which can be used to populate filter dropdowns or selection lists in frontend applications.
 *
 * @example
 * {
 *   "fields": {
 *     "admissionCode": ["DCG7480102THPTQG", "DCG7480102ĐGNL"],
 *     "admissionType": ["THPTQG", "UTXT"],
 *     "admissionTypeName": ["Sử dụng điểm kỳ thi Tốt nghiệp Trung học phổ thông quốc gia", "Sử dụng phương thức tuyển thẳng"],
 *     "majorName": ["Công nghệ thông tin", "Hệ thống thông tin"],
 *     "province": ["TP. Hồ Chí Minh", "Hà Nội"],
 *     "studyProgram": ["Công nghệ Đổi mới và Sáng tạo", "Đại trà"],
 *     "subjectCombination": ["A00", "A01"],
 *     "uniCode": ["DCG", "DHV"],
 *     "uniName": ["TRƯỜNG ĐẠI HỌC FULBRIGHT VIỆT NAM", "TRƯỜNG ĐẠI HỌC GIA ĐỊNH"],
 *     "uniType": ["Tư thục", "Công lập"],
 *     "uniWebLink": ["https://fulbright.edu.vn/", "https://giadinh.edu.vn/"],
 *     "majorCode": [7460108, 7460112],
 *     "tuitionFee": ["13000000", "31150000"]
 *   }
 * }
 *
 * @class AdmissionFieldResponse
 */
export class AdmissionFieldResponse {
    /**
     * Record containing arrays of distinct values for each admission search field.
     * Each key corresponds to a filterable admission field, and each value is an array
     * of unique values found in the database for that field.
     *
     * @type {Record<AdmissionField, (number | string)[]>}
     * @memberof AdmissionFieldResponse
     */
    @Expose()
    fields!: Record<AdmissionField, (number | string)[]>;
}
