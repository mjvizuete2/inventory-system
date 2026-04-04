import { AppDataSource } from "../config/data-source";
import { CreateClientDto, UpdateClientDto } from "../dto/client.dto";
import { Client } from "../entities/Client";
import { HttpError } from "../utils/http-error";

export class ClientService {
  private readonly repository = AppDataSource.getRepository(Client);

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
    const exists = await this.repository.findOne({
      where: { identification: dto.identification }
    });
    if (exists) {
      throw new HttpError(409, "Client identification already exists");
    }

    const client = this.repository.create();
    client.documentType = dto.documentType;
    client.identification = dto.identification;
    client.name = dto.name;
    client.email = (dto.email ?? null) as unknown as string;
    client.phone = (dto.phone ?? null) as unknown as string;
    client.address = (dto.address ?? null) as unknown as string;

    return this.repository.save(client);
  }

  async update(id: number, dto: UpdateClientDto): Promise<Client> {
    const client = await this.getById(id);
    if (dto.identification !== client.identification) {
      const exists = await this.repository.findOne({
        where: { identification: dto.identification }
      });
      if (exists) {
        throw new HttpError(409, "Client identification already exists");
      }
    }

    Object.assign(client, {
      ...dto,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      address: dto.address ?? null
    });

    return this.repository.save(client);
  }

  async remove(id: number): Promise<void> {
    const client = await this.getById(id);
    await this.repository.remove(client);
  }
}
