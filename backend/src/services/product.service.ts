import { AppDataSource } from "../config/data-source";
import { CreateProductDto, UpdateProductDto } from "../dto/product.dto";
import { Category } from "../entities/Category";
import { Product } from "../entities/Product";
import { HttpError } from "../utils/http-error";
import { money } from "../utils/math";

export class ProductService {
  private readonly repository = AppDataSource.getRepository(Product);
  private readonly categoryRepository = AppDataSource.getRepository(Category);

  async list(): Promise<Product[]> {
    return this.repository.find({
      relations: { category: true },
      order: { id: "DESC" }
    });
  }

  async getById(id: number): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id },
      relations: { category: true }
    });
    if (!product) {
      throw new HttpError(404, "Product not found");
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const normalizedSku = dto.sku.trim().toUpperCase();
    const existing = await this.repository.findOne({ where: { sku: normalizedSku } });
    if (existing) {
      throw new HttpError(409, "SKU already exists");
    }
    const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new HttpError(404, "Category not found");
    }

    const product = this.repository.create();
    product.sku = normalizedSku;
    product.name = dto.name.trim();
    product.category = category;
    product.categoryId = category.id;
    product.description = (dto.description?.trim() || null) as unknown as string;
    product.provider = (dto.provider?.trim() || null) as unknown as string;
    product.active = dto.active ?? true;
    product.price = money(dto.price);
    product.stock = dto.stock;
    product.ivaRate = money(dto.ivaRate);

    const saved = await this.repository.save(product);
    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.getById(id);
    const normalizedSku = dto.sku.trim().toUpperCase();
    if (normalizedSku !== product.sku) {
      const existing = await this.repository.findOne({ where: { sku: normalizedSku } });
      if (existing) {
        throw new HttpError(409, "SKU already exists");
      }
    }
    const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new HttpError(404, "Category not found");
    }

    Object.assign(product, {
      ...dto,
      sku: normalizedSku,
      name: dto.name.trim(),
      category,
      categoryId: category.id,
      description: dto.description?.trim() || null,
      provider: dto.provider?.trim() || null,
      active: dto.active ?? true,
      price: money(dto.price),
      ivaRate: money(dto.ivaRate)
    });

    await this.repository.save(product);
    return this.getById(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.getById(id);
    await this.repository.remove(product);
  }
}
