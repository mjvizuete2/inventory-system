import { AppDataSource } from "../config/data-source";
import { CreateClientDto, UpdateClientDto } from "../dto/client.dto";
import { Client } from "../entities/Client";
import { HttpError } from "../utils/http-error";
import {
  normalizeIdentification,
  normalizePhone,
  validateClientIdentification,
  validatePhone
} from "../utils/client-validation";

export class ClientService {
  private readonly repository = AppDataSource.getRepository(Client);

  private validateClientData(dto: CreateClientDto | UpdateClientDto): void {
    const identification = normalizeIdentification(dto.identification);
    if (!validateClientIdentification(dto.documentType, identification)) {
      throw new HttpError(400, "Invalid client identification");
    }

    if (!validatePhone(dto.phone)) {
      throw new HttpError(400, "Phone must have 10 digits");
    }
  }

  async list(): Promise<Client[]> {
    return this.repository.find({ order: { id: "DESC" } });
  }

  async getById(id: number): Promise<Client> {
    const client = await this.repository.findOne({ where: { id } });
    if (!client) {
      throw new HttpError(404, "Client not found");
    }
    return client;
  }

  async create(dto: CreateClientDto): Promise<Client> {
    this.validateClientData(dto);
    const identification = normalizeIdentification(dto.identification);
    const exists = await this.repository.findOne({
      where: { identification }
    });
    if (exists) {
      throw new HttpError(409, "Client identification already exists");
    }

    const client = this.repository.create();
    client.documentType = dto.documentType.trim().toUpperCase();
    client.identification = identification;
    client.name = dto.name.trim();
    client.email = (dto.email ?? null) as unknown as string;
    client.phone = (normalizePhone(dto.phone) || null) as unknown as string;
    client.address = (dto.address?.trim() ?? null) as unknown as string;

    return this.repository.save(client);
  }

  async update(id: number, dto: UpdateClientDto): Promise<Client> {
    const client = await this.getById(id);
    this.validateClientData(dto);
    const identification = normalizeIdentification(dto.identification);
    if (identification !== client.identification) {
      const exists = await this.repository.findOne({
        where: { identification }
      });
      if (exists) {
        throw new HttpError(409, "Client identification already exists");
      }
    }

    Object.assign(client, {
      ...dto,
      documentType: dto.documentType.trim().toUpperCase(),
      identification,
      name: dto.name.trim(),
      email: dto.email ?? null,
      phone: normalizePhone(dto.phone) || null,
      address: dto.address?.trim() ?? null
    });

    return this.repository.save(client);
  }

  async remove(id: number): Promise<void> {
    const client = await this.getById(id);
    await this.repository.remove(client);
  }
}
