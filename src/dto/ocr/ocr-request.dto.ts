import { Expose, Type } from "class-transformer";
import { IsArray, IsIn, IsInt, ValidateNested } from "class-validator";

import { SubjectScore } from "./subject-score.dto.js";

export class OcrRequest {
    /**
     * @example 10
     */
    @Expose()
    @IsIn([10, 11, 12])
    @IsInt()
    @Type(() => Number)
    grade!: number;

    /**
     * @example 1
     */
    @Expose()
    @IsIn([1, 2])
    @IsInt()
    @Type(() => Number)
    semester!: number;

    /**
     * Array of subject scores for transcript creation
     * Contains subjects and their corresponding scores for a specific grade or semester.
     * Each entry includes a subject name (from TranscriptSubject enum) and a numeric score.
     *
     * @type {SubjectScore[]}
     * @required
     * @see SubjectScore for detailed structure and validation rules
     * @example [
     *   {
     *     "name": "Toán",
     *     "score": 8.5
     *   },
     *   {
     *     "name": "Ngữ Văn",
     *     "score": 7.0
     *   },
     *   {
     *     "name": "Tiếng Anh",
     *     "score": 9.0
     *   },
     *   {
     *     "name": "Vật Lý",
     *     "score": 8.0
     *   },
     *   {
     *     "name": "Hóa Học",
     *     "score": 7.5
     *   },
     *   {
     *     "name": "Sinh Học",
     *     "score": 8.0
     *   },
     *   {
     *     "name": "Lịch Sử",
     *     "score": 7.0
     *   },
     *   {
     *     "name": "Địa Lý",
     *     "score": 7.5
     *   },
     *   {
     *     "name": "GDKTPL",
     *     "score": 9.0
     *   },
     *   {
     *     "name": "Tin Học",
     *     "score": 8.5
     *   },
     *   {
     *     "name": "Công Nghệ",
     *     "score": 8.0
     *   }
     * ]
     * @example [
     *   {
     *     "name": "Toán",
     *     "score": 0
     *   },
     *   {
     *     "name": "Ngữ Văn",
     *     "score": 0
     *   },
     *   {
     *     "name": "Tiếng Anh",
     *     "score": 0
     *   },
     *   {
     *     "name": "Vật Lý",
     *     "score": 0
     *   },
     *   {
     *     "name": "Hóa Học",
     *     "score": 0
     *   },
     *   {
     *     "name": "Sinh Học",
     *     "score": 0
     *   },
     *   {
     *     "name": "Lịch Sử",
     *     "score": 0
     *   },
     *   {
     *     "name": "Địa Lý",
     *     "score": 0
     *   },
     *   {
     *     "name": "GDKTPL",
     *     "score": 0
     *   },
     *   {
     *     "name": "Tin Học",
     *     "score": 0
     *   },
     *   {
     *     "name": "Công Nghệ",
     *     "score": 0
     *   },
     *   {
     *     "name": "Tiếng Pháp",
     *     "score": 0
     *   },
     *   {
     *     "name": "Tiếng Đức",
     *     "score": 0
     *   },
     *   {
     *     "name": "Tiếng Nga",
     *     "score": 0
     *   },
     *   {
     *     "name": "Tiếng Nhật",
     *     "score": 0
     *   },
     *   {
     *     "name": "Tiếng Hàn",
     *     "score": 0
     *   },
     *   {
     *     "name": "Tiếng Trung",
     *     "score": 0
     *   }
     * ]
     */
    @Expose()
    @IsArray()
    @Type(() => SubjectScore)
    @ValidateNested({ each: true })
    subjectScores!: SubjectScore[];
}
