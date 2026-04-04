import { AppDataSource } from "../config/data-source";
import { CreateProductDto, UpdateProductDto } from "../dto/product.dto";
import { Product } from "../entities/Product";
import { HttpError } from "../utils/http-error";
import { money } from "../utils/math";

export class ProductService {
  private readonly repository = AppDataSource.getRepository(Product);

  async list(): Promise<Product[]> {
    return this.repository.find({ order: { id: "DESC" } });
  }

  async getById(id: number): Promise<Product> {
    const product = await this.repository.findOne({ where: { id } });
    if (!product) {
      throw new HttpError(404, "Product not found");
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.repository.findOne({ where: { sku: dto.sku } });
    if (existing) {
      throw new HttpError(409, "SKU already exists");
    }

    const product = this.repository.create();
    product.sku = dto.sku;
    product.name = dto.name;
    product.description = (dto.description ?? null) as unknown as string;
    product.active = dto.active ?? true;
    product.price = money(dto.price);
    product.stock = dto.stock;
    product.ivaRate = money(dto.ivaRate);

    return this.repository.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.getById(id);
    if (dto.sku !== product.sku) {
      const existing = await this.repository.findOne({ where: { sku: dto.sku } });
      if (existing) {
        throw new HttpError(409, "SKU already exists");
      }
    }

    Object.assign(product, {
      ...dto,
      description: dto.description ?? null,
      active: dto.active ?? true,
      price: money(dto.price),
      ivaRate: money(dto.ivaRate)
    });

    return this.repository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.getById(id);
    await this.repository.remove(product);
  }
}
