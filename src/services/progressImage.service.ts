import fs from "fs";

import {
  DEFAULT_PROGRESS_IMAGE_POSE,
  PROGRESS_IMAGE_POSES,
  type ProgressImage,
  type ProgressImagePose,
} from "../entities/ProgressImage";
import { uploadToCloudinary } from "../libs/cloudinary";
import * as clientRepository from "../repositories/client.repository";
import * as progressImageRepository from "../repositories/progressImage.repository";

function parsePose(value: unknown): ProgressImagePose {
  if (value === undefined || value === null || String(value).trim() === "") {
    return DEFAULT_PROGRESS_IMAGE_POSE;
  }

  const pose = String(value).trim();
  if ((PROGRESS_IMAGE_POSES as readonly string[]).includes(pose)) {
    return pose as ProgressImagePose;
  }

  throw Object.assign(
    new Error(`pose debe ser uno de: ${PROGRESS_IMAGE_POSES.join(", ")}`),
    { status: 400 },
  );
}

function withDefaultPose<T extends ProgressImage>(image: T): T {
  return {
    ...image,
    pose: image.pose ?? DEFAULT_PROGRESS_IMAGE_POSE,
  };
}

async function assertClientExists(clientId: string) {
  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }
  return client;
}

/** Elimina el archivo temporal de disco en segundo plano (no bloquea). */
function cleanTempFile(path?: string) {
  if (!path) return;
  fs.unlink(path, () => undefined);
}

/** Lista todas las imágenes de progreso de un cliente. */
export async function listImagesByClient(clientId: string) {
  if (!clientId?.trim()) {
    throw Object.assign(new Error("clientId es obligatorio"), { status: 400 });
  }
  await assertClientExists(clientId);
  const images = await progressImageRepository.findImagesByClient(clientId);
  return images.map(withDefaultPose);
}

export async function getImageById(id: string) {
  const image = await progressImageRepository.findImageById(id);
  if (!image) {
    throw Object.assign(new Error("Imagen no encontrada"), { status: 404 });
  }
  return withDefaultPose(image);
}

/**
 * Sube una imagen a Cloudinary y guarda la URL en la base de datos.
 * Requiere que el middleware de multer haya procesado el fichero antes.
 */
export async function uploadProgressImage(
  clientId: string,
  file: Express.Multer.File,
  poseInput?: unknown,
) {
  if (!clientId?.trim()) {
    cleanTempFile(file?.path);
    throw Object.assign(new Error("clientId es obligatorio"), { status: 400 });
  }

  await assertClientExists(clientId);

  const secureUrl = await uploadToCloudinary(file).catch((err: unknown) => {
    cleanTempFile(file?.path);
    throw Object.assign(
      new Error(`Error al subir la imagen: ${err instanceof Error ? err.message : err}`),
      { status: 502 },
    );
  });

  cleanTempFile(file?.path);

  if (!secureUrl) {
    throw Object.assign(new Error("Cloudinary no devolvió una URL"), { status: 502 });
  }

  const now = new Date();
  return progressImageRepository.insertImage({
    clientId,
    image: secureUrl,
    pose: parsePose(poseInput),
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteProgressImage(id: string) {
  const deleted = await progressImageRepository.deleteImageById(id);
  if (!deleted) {
    throw Object.assign(new Error("Imagen no encontrada"), { status: 404 });
  }
}
