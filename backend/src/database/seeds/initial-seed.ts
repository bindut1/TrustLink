/**
 * Initial seed for demo / development.
 *
 * Idempotent — checks for the admin account before seeding; bails out if found.
 *
 * Creates:
 *   - 1 admin
 *   - 3 institutions (approved, with mock blockchain_address)
 *   - 5 credential types
 *   - 5 recruiters + companies
 *   - 10 jobs
 *   - 20 candidates
 *   - ~40 credentials (issued, with mock vc_jwt / blockchain tx_hash)
 *   - candidate_skills inferred from issued credentials
 *
 * Usage:  npm run seed
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { randomUUID, createHash } from 'crypto';
import AppDataSource from '../data-source';
import { CandidateProfile } from '../entities/candidate-profile.entity';
import { CandidateSkill } from '../entities/candidate-skill.entity';
import { CredentialType } from '../entities/credential-type.entity';
import { Credential } from '../entities/credential.entity';
import { Institution } from '../entities/institution.entity';
import { Job } from '../entities/job.entity';
import { RecruiterProfile } from '../entities/recruiter-profile.entity';
import { User } from '../entities/user.entity';
import {
  AccountStatus,
  ApprovalStatus,
  CredentialCategory,
  CredentialStatus,
  JobStatus,
  UserRole,
} from '../enums';

const PASSWORD = 'Password@123';
const BCRYPT_ROUNDS = 10;

// ─────────────────────────── Data definitions ───────────────────────────

const ADMIN = {
  email: 'admin@trustlink.com',
  fullName: 'TrustLink Admin',
};

const INSTITUTIONS = [
  {
    issuer: { email: 'issuer.dut@trustlink.com', fullName: 'DUT Registrar' },
    name: 'Trường Đại học Bách Khoa - ĐHĐN',
    nameEn: 'Danang University of Technology',
    abbreviation: 'DUT',
    institutionType: 'university',
    city: 'Đà Nẵng',
    website: 'https://dut.udn.vn',
    blockchainAddress: '0x' + 'a'.repeat(40),
    didIdentifier: 'did:ethr:polygon:0x' + 'a'.repeat(40),
  },
  {
    issuer: { email: 'issuer.fpt@trustlink.com', fullName: 'FPT Registrar' },
    name: 'Trường Đại học FPT',
    nameEn: 'FPT University',
    abbreviation: 'FPTU',
    institutionType: 'university',
    city: 'Hồ Chí Minh',
    website: 'https://daihoc.fpt.edu.vn',
    blockchainAddress: '0x' + 'b'.repeat(40),
    didIdentifier: 'did:ethr:polygon:0x' + 'b'.repeat(40),
  },
  {
    issuer: { email: 'issuer.bca@trustlink.com', fullName: 'BCA Cert Office' },
    name: 'British Council Academy',
    nameEn: 'British Council Academy',
    abbreviation: 'BCA',
    institutionType: 'training_center',
    city: 'Hà Nội',
    website: 'https://britishcouncil.vn',
    blockchainAddress: '0x' + 'c'.repeat(40),
    didIdentifier: 'did:ethr:polygon:0x' + 'c'.repeat(40),
  },
];

const CREDENTIAL_TYPES = [
  {
    category: CredentialCategory.DEGREE,
    name: 'Bằng Cử nhân Kỹ thuật',
    nameEn: 'Bachelor of Engineering',
    fieldSchema: {
      fields: [
        { key: 'major', label: 'Ngành học', type: 'text', required: true },
        { key: 'gpa', label: 'GPA', type: 'number', required: false },
        {
          key: 'classification',
          label: 'Xếp loại',
          type: 'select',
          options: ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình'],
          required: true,
        },
      ],
    },
  },
  {
    category: CredentialCategory.DEGREE,
    name: 'Bằng Thạc sĩ',
    nameEn: 'Master Degree',
    fieldSchema: {
      fields: [
        { key: 'major', label: 'Ngành học', type: 'text', required: true },
        { key: 'thesis_title', label: 'Tên luận văn', type: 'text', required: false },
      ],
    },
  },
  {
    category: CredentialCategory.IT_CERTIFICATE,
    name: 'AWS Certified Solutions Architect',
    nameEn: 'AWS Certified Solutions Architect',
    fieldSchema: {
      fields: [
        {
          key: 'level',
          label: 'Level',
          type: 'select',
          options: ['Associate', 'Professional'],
          required: true,
        },
        { key: 'score', label: 'Score', type: 'number', required: false },
      ],
    },
  },
  {
    category: CredentialCategory.LANGUAGE_CERTIFICATE,
    name: 'IELTS',
    nameEn: 'IELTS',
    fieldSchema: {
      fields: [
        { key: 'overall', label: 'Overall band', type: 'number', required: true },
        { key: 'listening', label: 'Listening', type: 'number', required: false },
        { key: 'reading', label: 'Reading', type: 'number', required: false },
        { key: 'writing', label: 'Writing', type: 'number', required: false },
        { key: 'speaking', label: 'Speaking', type: 'number', required: false },
      ],
    },
  },
  {
    category: CredentialCategory.PROFESSIONAL_CERTIFICATE,
    name: 'Google Professional Cloud Developer',
    nameEn: 'Google Professional Cloud Developer',
    fieldSchema: {
      fields: [
        { key: 'score', label: 'Score', type: 'number', required: false },
      ],
    },
  },
];

const RECRUITERS = [
  {
    user: { email: 'recruiter.tma@trustlink.com', fullName: 'Nguyen Anh Tuan' },
    companyName: 'TMA Solutions',
    industry: 'Software Outsourcing',
    companySize: '1000+',
    city: 'Hồ Chí Minh',
  },
  {
    user: { email: 'recruiter.vng@trustlink.com', fullName: 'Tran Thi Mai' },
    companyName: 'VNG Corporation',
    industry: 'Internet / Gaming',
    companySize: '1000+',
    city: 'Hồ Chí Minh',
  },
  {
    user: { email: 'recruiter.fpt@trustlink.com', fullName: 'Le Van Hung' },
    companyName: 'FPT Software',
    industry: 'Software Outsourcing',
    companySize: '5000+',
    city: 'Hà Nội',
  },
  {
    user: { email: 'recruiter.tiki@trustlink.com', fullName: 'Pham Quoc An' },
    companyName: 'Tiki',
    industry: 'E-commerce',
    companySize: '501-1000',
    city: 'Hồ Chí Minh',
  },
  {
    user: { email: 'recruiter.momo@trustlink.com', fullName: 'Hoang Linh' },
    companyName: 'MoMo',
    industry: 'Fintech',
    companySize: '1000+',
    city: 'Hồ Chí Minh',
  },
];

const JOBS = [
  {
    title: 'Senior Backend Engineer (Node.js)',
    description:
      'Build and scale REST APIs and microservices for our e-commerce platform serving millions of users.',
    requirements: 'Strong Node.js + PostgreSQL, system design, 4+ years.',
    requiredSkills: ['nodejs', 'typescript', 'postgresql', 'docker'],
    preferredSkills: ['nestjs', 'redis', 'kubernetes'],
    salaryMin: 30000,
    salaryMax: 50000,
    isRemote: false,
    experienceLevel: 'senior',
  },
  {
    title: 'Frontend Engineer (React)',
    description: 'Build delightful UIs with React, TypeScript and Next.js.',
    requirements: 'React 18+, TypeScript, REST API integration.',
    requiredSkills: ['react', 'typescript', 'nextjs'],
    preferredSkills: ['tailwindcss', 'graphql'],
    salaryMin: 20000,
    salaryMax: 40000,
    isRemote: true,
    experienceLevel: 'mid',
  },
  {
    title: 'Cloud Engineer (AWS)',
    description: 'Design and maintain cloud infrastructure on AWS.',
    requirements: 'AWS certification preferred, Terraform/CloudFormation.',
    requiredSkills: ['aws', 'terraform', 'docker', 'kubernetes'],
    preferredSkills: ['python', 'ci/cd'],
    salaryMin: 35000,
    salaryMax: 60000,
    isRemote: false,
    experienceLevel: 'senior',
  },
  {
    title: 'Mobile Developer (React Native)',
    description: 'Build cross-platform mobile apps.',
    requirements: 'React Native, iOS/Android publishing experience.',
    requiredSkills: ['react native', 'typescript', 'mobile'],
    preferredSkills: ['firebase', 'fastlane'],
    salaryMin: 18000,
    salaryMax: 35000,
    isRemote: true,
    experienceLevel: 'mid',
  },
  {
    title: 'Data Engineer',
    description: 'Design ETL pipelines and data warehouses.',
    requirements: 'SQL, Spark, Airflow, Python.',
    requiredSkills: ['python', 'sql', 'spark', 'airflow'],
    preferredSkills: ['aws', 'kafka'],
    salaryMin: 25000,
    salaryMax: 45000,
    isRemote: false,
    experienceLevel: 'mid',
  },
  {
    title: 'DevOps Engineer',
    description: 'CI/CD, Kubernetes, observability.',
    requirements: '3+ years DevOps, Kubernetes, Docker.',
    requiredSkills: ['kubernetes', 'docker', 'ci/cd', 'linux'],
    preferredSkills: ['terraform', 'aws', 'grafana'],
    salaryMin: 28000,
    salaryMax: 48000,
    isRemote: true,
    experienceLevel: 'senior',
  },
  {
    title: 'Junior Backend Developer',
    description: 'Entry-level role for fresh graduates with backend focus.',
    requirements: 'Java or Node.js fundamentals, SQL.',
    requiredSkills: ['java', 'sql'],
    preferredSkills: ['spring boot', 'rest api'],
    salaryMin: 10000,
    salaryMax: 18000,
    isRemote: false,
    experienceLevel: 'entry',
  },
  {
    title: 'AI/ML Engineer',
    description: 'Build ML models for recommendation and ranking.',
    requirements: 'Python, PyTorch/TF, ML production experience.',
    requiredSkills: ['python', 'pytorch', 'machine learning'],
    preferredSkills: ['nlp', 'aws sagemaker'],
    salaryMin: 30000,
    salaryMax: 55000,
    isRemote: false,
    experienceLevel: 'senior',
  },
  {
    title: 'Fullstack Engineer (PERN)',
    description: 'Build end-to-end features on PERN stack.',
    requirements: 'React, Node.js, PostgreSQL, Express.',
    requiredSkills: ['react', 'nodejs', 'postgresql', 'express'],
    preferredSkills: ['typescript', 'docker'],
    salaryMin: 22000,
    salaryMax: 38000,
    isRemote: true,
    experienceLevel: 'mid',
  },
  {
    title: 'QA Automation Engineer',
    description: 'Automate test coverage for web and mobile apps.',
    requirements: 'Cypress, Playwright, or Selenium.',
    requiredSkills: ['cypress', 'javascript', 'automation testing'],
    preferredSkills: ['playwright', 'k6'],
    salaryMin: 15000,
    salaryMax: 30000,
    isRemote: false,
    experienceLevel: 'mid',
  },
];

const CANDIDATE_NAMES = [
  'Nguyen Van A',
  'Tran Thi B',
  'Le Quang C',
  'Pham Minh D',
  'Hoang Thuy E',
  'Vu Hai F',
  'Dang Kim G',
  'Bui Anh H',
  'Do Mai I',
  'Ngo Thanh J',
  'Truong Tuan K',
  'Phan Linh L',
  'Vo Bach M',
  'Mai Phuong N',
  'Ly Khanh O',
  'Cao Thien P',
  'Duong Hai Q',
  'Ha Minh R',
  'Tran Quoc S',
  'Pham Bao T',
];

const SKILL_POOLS: Array<{ skills: string[]; verifyTitle: string }> = [
  { skills: ['nodejs', 'typescript', 'postgresql', 'docker', 'nestjs'], verifyTitle: 'Bachelor of Engineering' },
  { skills: ['react', 'typescript', 'nextjs', 'tailwindcss'], verifyTitle: 'Bachelor of Engineering' },
  { skills: ['python', 'pytorch', 'machine learning', 'nlp'], verifyTitle: 'Bachelor of Engineering' },
  { skills: ['aws', 'terraform', 'docker', 'kubernetes', 'ci/cd'], verifyTitle: 'AWS Certified Solutions Architect' },
  { skills: ['java', 'spring boot', 'sql', 'rest api'], verifyTitle: 'Bachelor of Engineering' },
  { skills: ['react native', 'typescript', 'mobile', 'firebase'], verifyTitle: 'Bachelor of Engineering' },
  { skills: ['cypress', 'javascript', 'automation testing'], verifyTitle: 'Bachelor of Engineering' },
];

// ─────────────────────────── Helpers ───────────────────────────

function pickSkillPool(idx: number) {
  return SKILL_POOLS[idx % SKILL_POOLS.length];
}

function mockBlockchain(id: string) {
  const hash = createHash('sha256').update(id).digest('hex');
  return {
    credentialHash: '0x' + hash.slice(0, 64),
    blockchainTxHash: '0x' + hash.slice(0, 64),
    blockchainBlockNumber: String(
      5000000 + (parseInt(hash.slice(0, 6), 16) % 100000),
    ),
    blockchainTimestamp: new Date(),
  };
}

// ─────────────────────────── Main ───────────────────────────

async function seed() {
  await AppDataSource.initialize();
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: { email: ADMIN.email } });
  if (existing) {
    console.log(`✓ Admin already exists (${ADMIN.email}). Seed skipped.`);
    await AppDataSource.destroy();
    return;
  }

  console.log('Seeding TrustLink demo data...');

  await AppDataSource.transaction(async (manager) => {
    // 1. Admin
    const admin = await manager.save(
      manager.create(User, {
        email: ADMIN.email,
        passwordHash,
        role: UserRole.ADMIN,
        fullName: ADMIN.fullName,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      }),
    );
    console.log(`  admin: ${admin.email}`);

    // 2. Credential types
    const credentialTypes = await manager.save(
      CREDENTIAL_TYPES.map((ct) =>
        manager.create(CredentialType, {
          category: ct.category,
          name: ct.name,
          nameEn: ct.nameEn,
          fieldSchema: ct.fieldSchema,
          isActive: true,
        }),
      ),
    );
    console.log(`  credential types: ${credentialTypes.length}`);

    // 3. Institutions + issuer users
    const institutions: Institution[] = [];
    for (const inst of INSTITUTIONS) {
      const issuer = await manager.save(
        manager.create(User, {
          email: inst.issuer.email,
          passwordHash,
          role: UserRole.ISSUER,
          fullName: inst.issuer.fullName,
          status: AccountStatus.ACTIVE,
          emailVerified: true,
        }),
      );
      const institution = await manager.save(
        manager.create(Institution, {
          userId: issuer.id,
          name: inst.name,
          nameEn: inst.nameEn,
          abbreviation: inst.abbreviation,
          institutionType: inst.institutionType,
          city: inst.city,
          website: inst.website,
          country: 'Vietnam',
          approvalStatus: ApprovalStatus.APPROVED,
          approvedBy: admin.id,
          approvedAt: new Date(),
          blockchainAddress: inst.blockchainAddress,
          didIdentifier: inst.didIdentifier,
        }),
      );
      institutions.push(institution);
    }
    console.log(`  institutions: ${institutions.length}`);

    // 4. Recruiters + companies
    const recruiterUsers: User[] = [];
    for (const r of RECRUITERS) {
      const user = await manager.save(
        manager.create(User, {
          email: r.user.email,
          passwordHash,
          role: UserRole.RECRUITER,
          fullName: r.user.fullName,
          status: AccountStatus.ACTIVE,
          emailVerified: true,
        }),
      );
      await manager.save(
        manager.create(RecruiterProfile, {
          userId: user.id,
          companyName: r.companyName,
          industry: r.industry,
          companySize: r.companySize,
          city: r.city,
          country: 'Vietnam',
          isVerified: true,
        }),
      );
      recruiterUsers.push(user);
    }
    console.log(`  recruiters: ${recruiterUsers.length}`);

    // 5. Jobs
    const jobs: Job[] = [];
    for (let i = 0; i < JOBS.length; i++) {
      const job = await manager.save(
        manager.create(Job, {
          recruiterId: recruiterUsers[i % recruiterUsers.length].id,
          title: JOBS[i].title,
          description: JOBS[i].description,
          requirements: JOBS[i].requirements,
          jobType: 'full_time',
          experienceLevel: JOBS[i].experienceLevel,
          city: 'Hồ Chí Minh',
          isRemote: JOBS[i].isRemote,
          salaryMin: JOBS[i].salaryMin,
          salaryMax: JOBS[i].salaryMax,
          requiredSkills: JOBS[i].requiredSkills,
          preferredSkills: JOBS[i].preferredSkills,
          status: JobStatus.OPEN,
        }),
      );
      jobs.push(job);
    }
    console.log(`  jobs: ${jobs.length}`);

    // 6. Candidates + profiles
    const candidates: User[] = [];
    for (let i = 0; i < CANDIDATE_NAMES.length; i++) {
      const email = `candidate${i + 1}@trustlink.com`;
      const user = await manager.save(
        manager.create(User, {
          email,
          passwordHash,
          role: UserRole.CANDIDATE,
          fullName: CANDIDATE_NAMES[i],
          status: AccountStatus.ACTIVE,
          emailVerified: true,
        }),
      );
      const pool = pickSkillPool(i);
      await manager.save(
        manager.create(CandidateProfile, {
          userId: user.id,
          bio: `Experienced engineer skilled in ${pool.skills.slice(0, 3).join(', ')}.`,
          yearsOfExperience: 1 + (i % 8),
          desiredPosition: pool.skills[0],
          desiredSalaryMin: 15000 + (i % 5) * 5000,
          desiredSalaryMax: 30000 + (i % 5) * 8000,
          isOpenToWork: true,
          profileCompleteness: 60 + (i % 4) * 10,
        }),
      );
      candidates.push(user);
    }
    console.log(`  candidates: ${candidates.length}`);

    // 7. Issue credentials to candidates
    const typeMap = new Map(credentialTypes.map((ct) => [ct.name, ct]));
    let credentialCount = 0;
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const pool = pickSkillPool(i);
      const credentialType = typeMap.get(
        pool.verifyTitle === 'Bachelor of Engineering'
          ? 'Bằng Cử nhân Kỹ thuật'
          : 'AWS Certified Solutions Architect',
      )!;
      const institution = institutions[i % institutions.length];

      const credentialId = randomUUID();
      const blockchain = mockBlockchain(credentialId);
      const credential = await manager.save(
        manager.create(Credential, {
          id: credentialId,
          credentialNumber: `${institution.abbreviation}-${2026}-${1000 + i}`,
          credentialTypeId: credentialType.id,
          institutionId: institution.id,
          candidateId: candidate.id,
          title: `${credentialType.name} (${pool.skills[0]})`,
          issuedDate: new Date(2024, 0, 1),
          metadata: { major: pool.skills[0], gpa: 3.0 + (i % 9) / 10 },
          extractedSkills: pool.skills,
          status: CredentialStatus.ISSUED,
          credentialHash: blockchain.credentialHash,
          blockchainTxHash: blockchain.blockchainTxHash,
          blockchainBlockNumber: blockchain.blockchainBlockNumber,
          blockchainTimestamp: blockchain.blockchainTimestamp,
          issuerDid: institution.didIdentifier,
        }),
      );
      credentialCount++;

      // 8. Candidate skills (verified from credential)
      for (const skill of pool.skills) {
        await manager.save(
          manager.create(CandidateSkill, {
            candidateId: candidate.id,
            skillName: skill,
            skillNameNormalized: skill.toLowerCase().trim(),
            proficiencyLevel: 'intermediate',
            isVerified: true,
            sourceCredentialId: credential.id,
          }),
        );
      }

      // Second credential — IELTS for half of candidates
      if (i % 2 === 0) {
        const ielts = typeMap.get('IELTS')!;
        const id2 = randomUUID();
        const bc2 = mockBlockchain(id2);
        await manager.save(
          manager.create(Credential, {
            id: id2,
            credentialNumber: `BCA-IELTS-${2026}-${2000 + i}`,
            credentialTypeId: ielts.id,
            institutionId: institutions[2].id,
            candidateId: candidate.id,
            title: 'IELTS Academic',
            issuedDate: new Date(2024, 5, 15),
            metadata: { overall: 6.5 + (i % 4) * 0.5 },
            extractedSkills: ['english'],
            status: CredentialStatus.ISSUED,
            credentialHash: bc2.credentialHash,
            blockchainTxHash: bc2.blockchainTxHash,
            blockchainBlockNumber: bc2.blockchainBlockNumber,
            blockchainTimestamp: bc2.blockchainTimestamp,
            issuerDid: institutions[2].didIdentifier,
          }),
        );
        credentialCount++;
        await manager.save(
          manager.create(CandidateSkill, {
            candidateId: candidate.id,
            skillName: 'English',
            skillNameNormalized: 'english',
            proficiencyLevel: 'advanced',
            isVerified: true,
          }),
        );
      }
    }
    console.log(`  credentials issued: ${credentialCount}`);
  });

  console.log('\n✓ Seed completed.');
  console.log('  Admin login: admin@trustlink.com / Password@123');
  console.log('  Issuer:      issuer.dut@trustlink.com / Password@123');
  console.log('  Recruiter:   recruiter.tma@trustlink.com / Password@123');
  console.log('  Candidate:   candidate1@trustlink.com / Password@123');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
