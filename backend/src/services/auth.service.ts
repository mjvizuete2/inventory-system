import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/data-source";
import { LoginDto } from "../dto/auth.dto";
import { User } from "../entities/User";
import { HttpError } from "../utils/http-error";
import { signToken } from "../utils/jwt";

export class AuthService {
  private readonly userRepository = AppDataSource.getRepository(User);

  async login(dto: LoginDto): Promise<{ token: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() }
    });

    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new HttpError(401, "Invalid credentials");
    }

    return {
      token: signToken({
        sub: user.id,
        email: user.email,
        role: user.role
      })
    };
  }
}
