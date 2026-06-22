import { detachOrDeleteCredentialSkills } from './skill-sync';

/**
 * On credential revocation: self-declared skills revert to a claimed skill
 * (detach + unverify), credential-only skills are deleted.
 */
describe('detachOrDeleteCredentialSkills', () => {
  it('detaches self-declared skills first, then deletes the rest', async () => {
    const calls: string[] = [];
    const repo = {
      update: jest.fn(async () => {
        calls.push('update');
      }),
      delete: jest.fn(async () => {
        calls.push('delete');
      }),
    };

    await detachOrDeleteCredentialSkills(repo as never, 'cred-1');

    // self-declared rows are reverted to an unverified, source-less skill
    expect(repo.update).toHaveBeenCalledWith(
      { sourceCredentialId: 'cred-1', isSelfDeclared: true },
      { sourceCredentialId: null, isVerified: false },
    );
    // remaining (credential-only) rows are removed
    expect(repo.delete).toHaveBeenCalledWith({ sourceCredentialId: 'cred-1' });
    // order matters: detach must run before delete
    expect(calls).toEqual(['update', 'delete']);
  });
});
