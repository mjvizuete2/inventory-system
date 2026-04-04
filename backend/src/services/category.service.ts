import { AppDataSource } from "../config/data-source";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";
import { Category } from "../entities/Category";
import { Product } from "../entities/Product";
import { HttpError } from "../utils/http-error";

export class CategoryService {
  private readonly repository = AppDataSource.getRepository(Category);
  private readonly productRepository = AppDataSource.getRepository(Product);

  async list(): Promise<Category[]> {
    return this.repository.find({ order: { name: "ASC" } });
  }

  async getById(id: number): Promise<Category> {
    const category = await this.repository.findOne({ where: { id } });
    if (!category) {
      throw new HttpError(404, "Category not found");
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const exists = await this.repository.findOne({
      where: { name: dto.name.trim() }
    });
    if (exists) {
      throw new HttpError(409, "Category already exists");
    }

    const category = this.repository.create();
    category.name = dto.name.trim();
    category.description = dto.description?.trim() ?? "";
    category.active = dto.active ?? true;
    return this.repository.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.getById(id);
    const newName = dto.name.trim();

    if (newName !== category.name) {
      const exists = await this.repository.findOne({ where: { name: newName } });
      if (exists) {
        throw new HttpError(409, "Category already exists");
      }
    }

    category.name = newName;
    category.description = dto.description?.trim() ?? "";
    category.active = dto.active ?? true;
    return this.repository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.getById(id);
    const productsCount = await this.productRepository.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      throw new HttpError(400, "Category is in use by products");
    }

    await this.repository.remove(category);
  }
}
