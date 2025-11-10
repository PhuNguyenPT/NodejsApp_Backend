import { Expose } from "class-transformer";
import { IsNotEmpty, IsObject, IsString } from "class-validator";

/**
 * API Response for L1 prediction results with priority type and admission codes with scores.
 * L1 returns results grouped by priority type (loai_uu_tien) with multiple admission codes and their scores.
 *
 * @example
 * {
 *   "loai_uu_tien": "HSG Toán",
 *   "ma_xet_tuyen": {
 *     "SPK-7140231V-Ưu Tiên": 0.08657108997612813,
 *     "SPK-7140246V-Ưu Tiên": 0.08569666015489133,
 *     "SPS-7140213-Ưu Tiên": 0.0249147897234483
 *   }
 * }
 */
export class L1PredictResult {
    /**
     * Priority type or special status category
     * @example "HSG Toán", "HSG Lý", "Không ưu tiên"
     */
    @Expose()
    @IsNotEmpty()
    @IsString()
    loai_uu_tien!: string;

    /**
     * Object mapping admission codes to their prediction scores
     * Key: Admission code (Mã xét tuyển) - unique identifier for the university program
     * Value: Prediction confidence score (0-1) indicating how well the student matches this program
     */
    @Expose()
    @IsNotEmpty()
    @IsObject()
    ma_xet_tuyen!: Record<string, number>;
}
