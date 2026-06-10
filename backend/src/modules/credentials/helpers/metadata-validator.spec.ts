import { BadRequestException } from '@nestjs/common';
import { validateCredentialMetadata } from './metadata-validator';

describe('validateCredentialMetadata', () => {
  const schema = {
    fields: [
      { key: 'gpa', required: true },
      { key: 'major', required: true },
      { key: 'note', required: false },
      { key: 'tags' }, // required omitted → optional
    ],
  };

  it('passes when all required fields are present', () => {
    expect(() =>
      validateCredentialMetadata({ gpa: '3.5', major: 'CS' }, schema),
    ).not.toThrow();
  });

  it('lists every missing required field in one error', () => {
    try {
      validateCredentialMetadata({}, schema);
      fail('expected BadRequestException');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      const body = (err as BadRequestException).getResponse() as {
        errors: string[];
      };
      expect(body.errors).toEqual([
        "Field 'gpa' is required",
        "Field 'major' is required",
      ]);
    }
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty string', ''],
    ['whitespace string', '   '],
    ['empty array', []],
  ])('treats %s as missing', (_label, value) => {
    expect(() =>
      validateCredentialMetadata({ gpa: value, major: 'CS' }, schema),
    ).toThrow(BadRequestException);
  });

  it.each([
    ['zero', 0],
    ['false', false],
    ['non-empty array', ['a']],
  ])('accepts %s as a present value', (_label, value) => {
    expect(() =>
      validateCredentialMetadata({ gpa: value, major: 'CS' }, schema),
    ).not.toThrow();
  });

  it('does nothing when the schema is absent or has no fields', () => {
    expect(() => validateCredentialMetadata({}, null)).not.toThrow();
    expect(() => validateCredentialMetadata({}, {})).not.toThrow();
    expect(() =>
      validateCredentialMetadata({}, { fields: 'oops' }),
    ).not.toThrow();
  });

  it('skips optional fields even when empty', () => {
    expect(() =>
      validateCredentialMetadata(
        { gpa: '3.0', major: 'CS', note: '', tags: [] },
        schema,
      ),
    ).not.toThrow();
  });
});
