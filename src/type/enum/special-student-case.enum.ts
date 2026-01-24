/**
 * Special student case indicating unique circumstances or qualifications
 * Optional field that can be used to specify if the student falls under any special category
 * Valid values are defined in the SpecialStudentCase enum.
 * @type {SpecialStudentCase}
 * @see SpecialStudentCase for valid enum values
 * @example "Học sinh thuộc huyện nghèo, vùng đặc biệt khó khăn"
 * @example "Anh hùng Lao động, Anh hùng Lực lượng vũ trang Nhân dân, Chiến sĩ thi đua toàn quốc"
 * @example "Học sinh trường chuyên"
 * @example "Dân tộc thiểu số rất ít người (Mông, La Ha,...)"
 */
export enum SpecialStudentCase {
    ETHNIC_MINORITY_STUDENT = "Học sinh thuộc huyện nghèo, vùng đặc biệt khó khăn",
    HEROES_AND_CONTRIBUTORS = "Anh hùng Lao động, Anh hùng Lực lượng vũ trang Nhân dân, Chiến sĩ thi đua toàn quốc",
    TRANSFER_STUDENT = "Học sinh trường chuyên",
    VERY_FEW_ETHNIC_MINORITY = "Dân tộc thiểu số rất ít người (Mông, La Ha,...)",
}
