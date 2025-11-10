import { Expose } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

/**
 * API Response item representing a prediction result with admission code and confidence score.
 *
 * @example
 * [
 *   {
 *     "ma_xet_tuyen": "SIU7140103THPTQG",
 *     "score": 0.9995385162588366
 *   },
 *   {
 *     "ma_xet_tuyen": "HIU7140114THPTQG",
 *     "score": 0.9992295911230948
 *   }
 * ]
 */
export class L2PredictResult {
    /**
     * Admission code (Mã xét tuyển) - unique identifier for the university program
     */
    @Expose()
    @IsNotEmpty()
    @IsString()
    ma_xet_tuyen!: string;

    /**
     * Prediction confidence score (0-1) indicating how well the student matches this program
     */
    @Expose()
    @IsNumber()
    score!: number;
}
