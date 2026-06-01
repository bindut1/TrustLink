import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateUserDto } from './dto/update-user.dto';

const AVATAR_FOLDER = 'trustlink/avatars';
const ALLOWED_AVATAR_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<User> {
    await this.userRepo.update(userId, dto);
    return this.findById(userId);
  }

  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<User> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_AVATAR_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported image type. Use JPEG, PNG, WebP or GIF.',
      );
    }

    const result = await this.cloudinary.uploadImage(file.buffer, {
      folder: AVATAR_FOLDER,
      publicId: `avatar_${userId}`,
    });

    await this.userRepo.update(userId, { avatarUrl: result.secure_url });
    return this.findById(userId);
  }

  async searchCandidates(
    q: string,
    limit = 10,
  ): Promise<Pick<User, 'id' | 'email' | 'fullName' | 'avatarUrl'>[]> {
    const term = `%${q.trim()}%`;
    const users = await this.userRepo.find({
      where: [
        { role: UserRole.CANDIDATE, email: ILike(term) },
        { role: UserRole.CANDIDATE, fullName: ILike(term) },
      ],
      order: { fullName: 'ASC' },
      take: limit,
    });
    return users.map(({ id, email, fullName, avatarUrl }) => ({
      id,
      email,
      fullName,
      avatarUrl,
    }));
  }

  async removeAvatar(userId: string): Promise<User> {
    await this.cloudinary.deleteImage(`${AVATAR_FOLDER}/avatar_${userId}`);
    await this.userRepo.update(userId, { avatarUrl: null });
    return this.findById(userId);
  }
}
