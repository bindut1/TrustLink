import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { AccountStatus, ApprovalStatus, UserRole } from '../../database/enums';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

const PASSWORD = 'correct-horse-battery';
// low rounds: fixtures only need bcrypt.compare to succeed, not be slow
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

type Mocks = ReturnType<typeof makeMocks>;

function makeMocks() {
  const manager = {
    create: jest.fn(
      (Entity: { name: string }, data: Record<string, unknown>) => ({
        __type: Entity.name,
        ...data,
      }),
    ),
    save: jest.fn((e: { __type?: string; id?: string }) => {
      e.id ??= `${e.__type ?? 'entity'}-1`;
      return Promise.resolve(e);
    }),
    update: jest.fn(() => Promise.resolve(undefined)),
  };
  const dataSource = {
    transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
  };
  const jwtService = { signAsync: jest.fn(() => Promise.resolve('jwt-access')) };
  const config = {
    get: jest.fn((_k: string, def?: string) => def),
  };
  const userRepo = {
    findOne: jest.fn(() => Promise.resolve(null)),
    save: jest.fn((u: unknown) => Promise.resolve(u)),
  };
  const refreshTokenRepo = {
    findOne: jest.fn(() => Promise.resolve(null)),
    save: jest.fn((t: unknown) => Promise.resolve(t)),
    create: jest.fn((d: unknown) => d),
  };
  const resetTokenRepo = {
    findOne: jest.fn(() => Promise.resolve(null)),
    save: jest.fn((t: unknown) => Promise.resolve(t)),
    create: jest.fn((d: unknown) => d),
  };
  const email = { sendPasswordReset: jest.fn(() => Promise.resolve()) };
  const auditLogs = { record: jest.fn(() => Promise.resolve()) };

  const service = new AuthService(
    dataSource as never,
    jwtService as never,
    config as never,
    userRepo as never,
    refreshTokenRepo as never,
    resetTokenRepo as never,
    email as never,
    auditLogs as never,
  );

  return {
    service,
    manager,
    dataSource,
    jwtService,
    userRepo,
    refreshTokenRepo,
    resetTokenRepo,
    email,
    auditLogs,
  };
}

function activeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'a@b.vn',
    passwordHash: PASSWORD_HASH,
    role: UserRole.CANDIDATE,
    status: AccountStatus.ACTIVE,
    ...overrides,
  };
}

describe('AuthService.register', () => {
  const baseDto = {
    email: 'New.User@Example.COM',
    password: PASSWORD,
    fullName: 'Nguyen Van A',
    role: UserRole.CANDIDATE,
  } as RegisterDto;

  it('rejects an email that is already in use', async () => {
    const m = makeMocks();
    m.userRepo.findOne.mockResolvedValue(activeUser() as never);
    await expect(m.service.register(baseDto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects self-registration as admin', async () => {
    const m = makeMocks();
    await expect(
      m.service.register({ ...baseDto, role: UserRole.ADMIN }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lowercases the email and stores a bcrypt hash, never the password', async () => {
    const m = makeMocks();
    await m.service.register(baseDto);

    const userCreate = m.manager.create.mock.calls.find(
      (c) => c[0].name === 'User',
    )!;
    expect(userCreate[1].email).toBe('new.user@example.com');
    expect(userCreate[1].passwordHash).not.toContain(PASSWORD);
    expect(
      bcrypt.compareSync(PASSWORD, userCreate[1].passwordHash as string),
    ).toBe(true);
  });

  it('creates a candidate profile and returns tokens for role=candidate', async () => {
    const m = makeMocks();
    const { tokens } = await m.service.register(baseDto);

    const created = m.manager.create.mock.calls.map((c) => c[0].name);
    expect(created).toEqual(['User', 'CandidateProfile']);
    expect(tokens.accessToken).toBe('jwt-access');
    expect(tokens.refreshToken).toMatch(/^[0-9a-f]{96}$/);
    // the refresh token is stored hashed, never raw
    const storedToken = m.refreshTokenRepo.create.mock.calls[0][0] as {
      tokenHash: string;
    };
    expect(storedToken.tokenHash).toBe(sha256(tokens.refreshToken));
  });

  it('creates a PENDING institution for role=issuer', async () => {
    const m = makeMocks();
    await m.service.register({
      ...baseDto,
      role: UserRole.ISSUER,
      institutionName: 'DUT',
      institutionType: 'university',
    } as RegisterDto);

    const instCreate = m.manager.create.mock.calls.find(
      (c) => c[0].name === 'Institution',
    )!;
    expect(instCreate[1].name).toBe('DUT');
    expect(instCreate[1].approvalStatus).toBe(ApprovalStatus.PENDING);
  });

  it('creates a recruiter profile for role=recruiter', async () => {
    const m = makeMocks();
    await m.service.register({
      ...baseDto,
      role: UserRole.RECRUITER,
      companyName: 'ACME',
    } as RegisterDto);

    const profileCreate = m.manager.create.mock.calls.find(
      (c) => c[0].name === 'RecruiterProfile',
    )!;
    expect(profileCreate[1].companyName).toBe('ACME');
  });
});

describe('AuthService.login', () => {
  const dto = { email: 'A@B.vn', password: PASSWORD };

  it('rejects an unknown email with the same message as a bad password', async () => {
    const m = makeMocks();
    await expect(m.service.login(dto)).rejects.toThrow('Invalid credentials');
  });

  it('rejects a wrong password without revealing the account exists', async () => {
    const m = makeMocks();
    m.userRepo.findOne.mockResolvedValue(activeUser() as never);
    await expect(
      m.service.login({ ...dto, password: 'wrong' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('rejects an inactive account', async () => {
    const m = makeMocks();
    m.userRepo.findOne.mockResolvedValue(
      activeUser({ status: AccountStatus.SUSPENDED }) as never,
    );
    await expect(m.service.login(dto)).rejects.toThrow('Account is not active');
  });

  it('updates lastLoginAt, records an audit log and returns tokens', async () => {
    const m = makeMocks();
    const user = activeUser();
    m.userRepo.findOne.mockResolvedValue(user as never);

    const { tokens } = await m.service.login(dto);

    expect(m.userRepo.findOne).toHaveBeenCalledWith({
      where: { email: 'a@b.vn' },
    });
    expect(
      (m.userRepo.save.mock.calls[0][0] as { lastLoginAt: Date }).lastLoginAt,
    ).toBeInstanceOf(Date);
    expect(m.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login', userId: user.id }),
    );
    expect(tokens.accessToken).toBe('jwt-access');
  });
});

describe('AuthService.refresh', () => {
  function storedToken(overrides: Record<string, unknown> = {}) {
    return {
      id: 'rt-1',
      tokenHash: sha256('raw-refresh'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user: activeUser(),
      ...overrides,
    };
  }

  it('looks the token up by its sha256 hash', async () => {
    const m = makeMocks();
    m.refreshTokenRepo.findOne.mockResolvedValue(storedToken() as never);
    await m.service.refresh('raw-refresh');
    expect(m.refreshTokenRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tokenHash: sha256('raw-refresh') }),
      }),
    );
  });

  it('rejects an unknown token', async () => {
    const m = makeMocks();
    await expect(m.service.refresh('nope')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an expired token', async () => {
    const m = makeMocks();
    m.refreshTokenRepo.findOne.mockResolvedValue(
      storedToken({ expiresAt: new Date(Date.now() - 1000) }) as never,
    );
    await expect(m.service.refresh('raw-refresh')).rejects.toThrow(
      'Refresh token expired',
    );
  });

  it('rejects when the account is no longer active', async () => {
    const m = makeMocks();
    m.refreshTokenRepo.findOne.mockResolvedValue(
      storedToken({
        user: activeUser({ status: AccountStatus.INACTIVE }),
      }) as never,
    );
    await expect(m.service.refresh('raw-refresh')).rejects.toThrow(
      'Account is not active',
    );
  });

  it('rotates: revokes the old token and issues a new pair', async () => {
    const m = makeMocks();
    const stored = storedToken();
    m.refreshTokenRepo.findOne.mockResolvedValue(stored as never);

    const tokens = await m.service.refresh('raw-refresh');

    expect(stored.revokedAt).toBeInstanceOf(Date);
    expect(m.refreshTokenRepo.save).toHaveBeenCalledWith(stored);
    expect(tokens.refreshToken).not.toBe('raw-refresh');
    expect(tokens.accessToken).toBe('jwt-access');
  });
});

describe('AuthService.logout', () => {
  it('revokes an active token', async () => {
    const m = makeMocks();
    const stored = { tokenHash: sha256('raw'), revokedAt: null };
    m.refreshTokenRepo.findOne.mockResolvedValue(stored as never);

    await m.service.logout('raw');

    expect(stored.revokedAt).toBeInstanceOf(Date);
    expect(m.refreshTokenRepo.save).toHaveBeenCalledWith(stored);
  });

  it('is a no-op for unknown or already-revoked tokens', async () => {
    const m = makeMocks();
    await m.service.logout('unknown');
    m.refreshTokenRepo.findOne.mockResolvedValue({
      revokedAt: new Date(),
    } as never);
    await m.service.logout('already-revoked');
    expect(m.refreshTokenRepo.save).not.toHaveBeenCalled();
  });
});

describe('AuthService.forgotPassword', () => {
  it('stays silent for unknown emails (no enumeration)', async () => {
    const m = makeMocks();
    await m.service.forgotPassword('ghost@b.vn');
    expect(m.resetTokenRepo.save).not.toHaveBeenCalled();
    expect(m.email.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('stores only the token hash and emails the raw token link', async () => {
    const m = makeMocks();
    m.userRepo.findOne.mockResolvedValue(activeUser() as never);

    await m.service.forgotPassword('A@B.vn');

    const [to, url] = m.email.sendPasswordReset.mock.calls[0] as [
      string,
      string,
    ];
    expect(to).toBe('a@b.vn');
    const rawToken = new URL(url).searchParams.get('token')!;
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/);

    const created = m.resetTokenRepo.create.mock.calls[0][0] as {
      tokenHash: string;
      expiresAt: Date;
    };
    expect(created.tokenHash).toBe(sha256(rawToken));
    expect(created.tokenHash).not.toBe(rawToken);
    expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('AuthService.changePassword', () => {
  it('rejects when the account does not exist', async () => {
    const m = makeMocks();
    await expect(
      m.service.changePassword('user-1', PASSWORD, 'new-password'),
    ).rejects.toThrow('Account not found');
  });

  it('rejects a wrong current password', async () => {
    const m = makeMocks();
    m.userRepo.findOne.mockResolvedValue(activeUser() as never);
    await expect(
      m.service.changePassword('user-1', 'wrong', 'new-password'),
    ).rejects.toThrow('Current password is incorrect');
  });

  it('rejects reusing the current password', async () => {
    const m = makeMocks();
    m.userRepo.findOne.mockResolvedValue(activeUser() as never);
    await expect(
      m.service.changePassword('user-1', PASSWORD, PASSWORD),
    ).rejects.toThrow('New password must differ from current password');
  });

  it('updates the hash and revokes all refresh tokens in one transaction', async () => {
    const m = makeMocks();
    m.userRepo.findOne.mockResolvedValue(activeUser() as never);

    await m.service.changePassword('user-1', PASSWORD, 'brand-new-pass');

    expect(m.manager.update).toHaveBeenCalledTimes(2);
    const [, , userPatch] = m.manager.update.mock.calls[0] as [
      unknown,
      unknown,
      { passwordHash: string },
    ];
    expect(bcrypt.compareSync('brand-new-pass', userPatch.passwordHash)).toBe(
      true,
    );
    const [, tokenWhere, tokenPatch] = m.manager.update.mock.calls[1] as [
      unknown,
      { userId: string },
      { revokedAt: Date },
    ];
    expect(tokenWhere.userId).toBe('user-1');
    expect(tokenPatch.revokedAt).toBeInstanceOf(Date);
    expect(m.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.password_change' }),
    );
  });
});

describe('AuthService.resetPassword', () => {
  function resetToken(overrides: Record<string, unknown> = {}) {
    return {
      userId: 'user-1',
      tokenHash: sha256('raw-reset'),
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      ...overrides,
    };
  }

  it('rejects an unknown or already-used token', async () => {
    const m = makeMocks();
    await expect(m.service.resetPassword('nope', 'x')).rejects.toThrow(
      'Invalid or already used token',
    );

    m.resetTokenRepo.findOne.mockResolvedValue(
      resetToken({ usedAt: new Date() }) as never,
    );
    await expect(m.service.resetPassword('raw-reset', 'x')).rejects.toThrow(
      'Invalid or already used token',
    );
  });

  it('rejects an expired token', async () => {
    const m = makeMocks();
    m.resetTokenRepo.findOne.mockResolvedValue(
      resetToken({ expiresAt: new Date(Date.now() - 1) }) as never,
    );
    await expect(m.service.resetPassword('raw-reset', 'x')).rejects.toThrow(
      'Token expired',
    );
  });

  it('sets the new password, burns the token and revokes refresh tokens', async () => {
    const m = makeMocks();
    const stored = resetToken();
    m.resetTokenRepo.findOne.mockResolvedValue(stored as never);

    await m.service.resetPassword('raw-reset', 'fresh-password');

    const [, userId, userPatch] = m.manager.update.mock.calls[0] as [
      unknown,
      string,
      { passwordHash: string },
    ];
    expect(userId).toBe('user-1');
    expect(bcrypt.compareSync('fresh-password', userPatch.passwordHash)).toBe(
      true,
    );
    expect(stored.usedAt).toBeInstanceOf(Date);
    expect(m.manager.save).toHaveBeenCalledWith(stored);
    expect(m.manager.update).toHaveBeenCalledTimes(2); // user + refresh tokens
  });
});
