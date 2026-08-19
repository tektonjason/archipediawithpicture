export interface StudentVerificationForm {
  school: string;
  college: string;
  major: string;
  studentId: string;
}

export type StudentVerificationResult = 'incomplete' | 'invalid' | 'valid';

export const ALLOWED_STUDENT_RESOURCE_MAJORS = ['建筑学', '城乡规划', '智能建造'] as const;

export function createEmptyStudentVerificationForm(): StudentVerificationForm {
  return { school: '', college: '', major: '', studentId: '' };
}

export function normalizeStudentVerificationForm(form: StudentVerificationForm): StudentVerificationForm {
  return {
    school: normalizeValue(form.school),
    college: normalizeValue(form.college),
    major: normalizeValue(form.major),
    studentId: normalizeValue(form.studentId),
  };
}

export function validateStudentResourceIdentity(form: StudentVerificationForm): {
  result: StudentVerificationResult;
  normalized: StudentVerificationForm;
} {
  const normalized = normalizeStudentVerificationForm(form);
  const values = Object.values(normalized);

  if (values.some(value => !value)) {
    return { result: 'incomplete', normalized };
  }

  const valid = (
    normalized.school === '宁夏大学' &&
    normalized.college === '建筑学院' &&
    ALLOWED_STUDENT_RESOURCE_MAJORS.some(major => major === normalized.major) &&
    /^120\d{8}$/.test(normalized.studentId)
  );

  return { result: valid ? 'valid' : 'invalid', normalized };
}

function normalizeValue(value: string): string {
  return value.replace(/\s+/g, '').trim();
}
