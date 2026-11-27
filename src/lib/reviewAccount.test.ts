import { describe, expect, it } from 'vitest';

import { isReviewEmail, REVIEW_EMAIL } from './purchases';

describe('cuenta de revisión', () => {
  it('reconoce el correo de revisión sin importar mayúsculas ni espacios', () => {
    expect(isReviewEmail(REVIEW_EMAIL)).toBe(true);
    expect(isReviewEmail(`  ${REVIEW_EMAIL.toUpperCase()} `)).toBe(true);
  });

  it('no confunde otros correos', () => {
    expect(isReviewEmail('appreview@gmail.com')).toBe(false);
    expect(isReviewEmail('')).toBe(false);
  });
});
