import { DomainRuleException, PreconditionRequiredException } from '#exceptions/domain_exception';

export function parseIfMatchVersion(value: string | undefined): number {
  if (value === undefined) {
    throw new PreconditionRequiredException('If-Match is required');
  }
  const match = /^"([1-9]\d*)"$/.exec(value);
  const version = match ? Number(match[1]) : Number.NaN;
  if (!Number.isSafeInteger(version) || version > 2147483647) {
    throw new DomainRuleException('Invalid If-Match header', [
      { field: 'If-Match', rule: 'format', message: 'Expected one strong quoted version' },
    ]);
  }
  return version;
}
