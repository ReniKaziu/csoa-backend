import { getCustomRepository, getRepository } from "typeorm";
import { File } from "../../common/utilities/File";
import { Attachment } from "../entities/attachment.entity";
import { AtachmentRepository } from "../repositories/attachment.repository";

export class AttachmentService {
  static getById = async (attachmentId: number) => {
    const attachmentRepository = getCustomRepository(AtachmentRepository);

    const attachment = await attachmentRepository.findById(attachmentId);

    return attachment;
  };

  static deleteById = async (attachment: Attachment) => {
    const attachmentRepository = getRepository(Attachment);
    File.deleteMedia(attachment.path);
    return await attachmentRepository.delete(attachment.id);
  };
}
