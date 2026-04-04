import { AppDataSource } from "../config/data-source";
import { DocumentSequence } from "../entities/DocumentSequence";

export class DocumentSequenceService {
  private readonly repository = AppDataSource.getRepository(DocumentSequence);

  async next(documentCode: string, establishmentCode: string, emissionPointCode: string): Promise<string> {
    let sequence = await this.repository.findOne({
      where: { documentCode, establishmentCode, emissionPointCode }
    });

    if (!sequence) {
      sequence = this.repository.create({
        documentCode,
        establishmentCode,
        emissionPointCode,
        currentNumber: 0
      });
    }

    sequence.currentNumber += 1;
    await this.repository.save(sequence);

    return String(sequence.currentNumber).padStart(9, "0");
  }
}
