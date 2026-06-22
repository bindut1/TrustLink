import { Repository } from 'typeorm';
import { CandidateSkill } from '../../../database/entities/candidate-skill.entity';

/**
 * Reconcile a candidate's skills when the credential that backed them is
 * revoked (or reissued). Per product rule:
 *   - skills the candidate also self-declared REVERT to a claimed skill
 *     (detach from the credential, mark unverified) — the candidate keeps them;
 *   - skills that only ever came from this credential are DELETED.
 *
 * Order matters: detach the self-declared ones first so they no longer match
 * `source_credential_id`, then delete whatever still points at the credential.
 */
export async function detachOrDeleteCredentialSkills(
  repo: Repository<CandidateSkill>,
  credentialId: string,
): Promise<void> {
  await repo.update(
    { sourceCredentialId: credentialId, isSelfDeclared: true },
    { sourceCredentialId: null, isVerified: false },
  );
  await repo.delete({ sourceCredentialId: credentialId });
}
