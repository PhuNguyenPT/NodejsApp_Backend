import { Type } from "class-transformer";
import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from "class-validator";

/**
 * HTTP validation error that wraps multiple validation issues.
 */
export class HTTPValidationError {
    @IsArray()
    @Type(() => ValidationError)
    @ValidateNested({ each: true })
    detail!: ValidationError[];
}

/**
 * API Response item - matches the external API response format exactly
 */
export class L2PredictResult {
    /**
     * Mã xét tuyển
     */
    @IsNotEmpty()
    @IsString()
    ma_xet_tuyen!: string;

    /**
     * Điểm xác suất model dự đoán mức độ phù hợp cho lựa chọn này
     */
    @IsNumber()
    score!: number;
}

/**
 * User input for prediction - matches the external API request format exactly
 */
export class L2PUserInput {
    /**
     * 1: Công lập, 0: Tư thục
     */
    @IsInt()
    cong_lap!: number;

    /**
     * Điểm chứng chỉ tiếng anh (nếu có)
     */
    @IsOptional()
    @IsString()
    diem_ccta?: string;

    /**
     * Điểm thi thực tế hoặc điểm chuẩn user đạt được
     */
    @IsNumber()
    diem_chuan!: number;

    /**
     * Điểm quy đổi (nếu có) từ các chứng chỉ tiếng anh
     */
    @IsNumber()
    @IsOptional()
    diem_quy_doi?: number;

    /**
     * Điểm trung bình học kỳ năm lớp 10 (1: Giỏi, 2: Khá, 3: Trung bình, 4: Yếu)
     */
    @IsInt()
    hk10!: number;

    /**
     * Điểm trung bình học kỳ năm lớp 11 (1: Giỏi, 2: Khá, 3: Trung bình, 4: Yếu)
     */
    @IsInt()
    hk11!: number;

    /**
     * Điểm trung bình học kỳ năm lớp 12 (1: Giỏi, 2: Khá, 3: Trung bình, 4: Yếu)
     */
    @IsInt()
    hk12!: number;

    /**
     * Học lực lớp 10 (1: Giỏi, 2: Khá, 3: Trung bình, 4: Yếu)
     */
    @IsInt()
    hl10!: number;

    /**
     * Học lực lớp 11 (1: Giỏi, 2: Khá, 3: Trung bình, 4: Yếu)
     */
    @IsInt()
    hl11!: number;

    /**
     * Học lực lớp 12 (1: Giỏi (trên 8), 2: Trên 7, 3: Khá, 4: Trung bình, 5: Yếu)
     */
    @IsInt()
    hl12!: number;

    /**
     * Mức học phí dự kiến của ngành (đơn vị: VNĐ/năm)
     */
    @IsNumber()
    hoc_phi!: number;

    /**
     * Nhóm ngành (vd: 714, 732, ...)
     */
    @IsInt()
    nhom_nganh!: number;

    /**
     * Tên chứng chỉ tiếng anh (nếu có)
     */
    @IsOptional()
    @IsString()
    ten_ccta?: string;

    /**
     * Tỉnh/Thành phố (vd: TP. Hồ Chí Minh, ...)
     */
    @IsNotEmpty()
    @IsString()
    tinh_tp!: string;

    /**
     * Tổ hợp môn (vd: D01, A00, VNUHCM, ...)
     */
    @IsNotEmpty()
    @IsString()
    to_hop_mon!: string;
}

/**
 * Represents a single validation error.
 */
export class ValidationError {
    /**
     * Location of the validation error (e.g., ['body', 'fieldName'] or ['query', 0]).
     */
    @IsArray()
    loc!: (number | string)[];

    /**
     * Error message.
     */
    @IsString()
    msg!: string;

    /**
     * Type of the error (e.g., "value_error", "type_error").
     */
    @IsString()
    type!: string;
}
