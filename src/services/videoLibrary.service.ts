import type {
  CreateVideoLibraryInput,
  UpdateVideoLibraryInput,
  VideoLibraryItem,
} from "../entities/VideoLibrary";
import * as videoLibraryRepository from "../repositories/videoLibrary.repository";

const REQUIRED_FIELDS: (keyof CreateVideoLibraryInput)[] = ["category", "icon", "tone"];
const ITEM_REQUIRED_FIELDS: (keyof VideoLibraryItem)[] = ["title", "type", "length", "phase", "url"];
const ITEM_TYPES = new Set<VideoLibraryItem["type"]>(["Vídeo", "PDF"]);
const TONES = new Set<CreateVideoLibraryInput["tone"]>(["gold", "primary", "purple"]);

function assertCreatePayload(
  body: Partial<CreateVideoLibraryInput>,
): asserts body is CreateVideoLibraryInput {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length > 0) {
    throw Object.assign(new Error(`Faltan campos obligatorios: ${missing.join(", ")}`), {
      status: 400,
    });
  }
}

function assertTone(value: unknown): CreateVideoLibraryInput["tone"] {
  const tone = String(value ?? "");
  if (!TONES.has(tone as CreateVideoLibraryInput["tone"])) {
    throw Object.assign(new Error('tone debe ser "gold", "primary" o "purple"'), { status: 400 });
  }
  return tone as CreateVideoLibraryInput["tone"];
}

function assertPhase(value: unknown, field = "phase"): number {
  const phase = Number(value);
  if (!Number.isInteger(phase) || phase < 1) {
    throw Object.assign(new Error(`${field} debe ser un entero mayor o igual a 1`), {
      status: 400,
    });
  }
  return phase;
}

function assertItems(value: unknown): VideoLibraryItem[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw Object.assign(new Error("items debe ser un array"), { status: 400 });
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`items[${index}] inválido`), { status: 400 });
    }
    const item = entry as Record<string, unknown>;
    const missing = ITEM_REQUIRED_FIELDS.filter((field) => {
      const fieldValue = item[field];
      return fieldValue === undefined || fieldValue === null || fieldValue === "";
    });
    if (missing.length > 0) {
      throw Object.assign(
        new Error(`items[${index}] faltan campos: ${missing.join(", ")}`),
        { status: 400 },
      );
    }

    const type = String(item.type);
    if (!ITEM_TYPES.has(type as VideoLibraryItem["type"])) {
      throw Object.assign(new Error(`items[${index}].type debe ser "Vídeo" o "PDF"`), {
        status: 400,
      });
    }

    return {
      title: String(item.title).trim(),
      type: type as VideoLibraryItem["type"],
      length: String(item.length).trim(),
      phase: assertPhase(item.phase, `items[${index}].phase`),
      url: String(item.url).trim(),
    };
  });
}

function parsePhaseFilter(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return assertPhase(value);
}

export async function listVideoLibraries(phase?: unknown) {
  return videoLibraryRepository.findAllVideoLibraries(parsePhaseFilter(phase));
}

export async function getVideoLibraryById(id: string, phase?: unknown) {
  const library = await videoLibraryRepository.findVideoLibraryById(id, parsePhaseFilter(phase));
  if (!library) {
    throw Object.assign(new Error("Categoría de videoteca no encontrada"), { status: 404 });
  }
  return library;
}

export async function createVideoLibrary(body: Partial<CreateVideoLibraryInput>) {
  assertCreatePayload(body);

  const existing = await videoLibraryRepository.findVideoLibraryByCategory(body.category);
  if (existing) {
    throw Object.assign(new Error("Ya existe una categoría de videoteca con ese nombre"), {
      status: 409,
    });
  }

  return videoLibraryRepository.insertVideoLibrary({
    category: body.category,
    icon: body.icon,
    tone: assertTone(body.tone),
    items: assertItems(body.items),
  });
}

export async function updateVideoLibrary(id: string, body: UpdateVideoLibraryInput) {
  const current = await videoLibraryRepository.findVideoLibraryById(id);
  if (!current) {
    throw Object.assign(new Error("Categoría de videoteca no encontrada"), { status: 404 });
  }

  if (body.category && body.category.trim().toLowerCase() !== current.category.toLowerCase()) {
    const existing = await videoLibraryRepository.findVideoLibraryByCategory(body.category);
    if (existing) {
      throw Object.assign(new Error("Ya existe una categoría de videoteca con ese nombre"), {
        status: 409,
      });
    }
  }

  const update: UpdateVideoLibraryInput = { ...body };
  if (body.tone !== undefined) update.tone = assertTone(body.tone);
  if (body.items !== undefined) update.items = assertItems(body.items);

  const updated = await videoLibraryRepository.updateVideoLibraryById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Categoría de videoteca no encontrada"), { status: 404 });
  }
  return updated;
}

export async function deleteVideoLibrary(id: string) {
  const deleted = await videoLibraryRepository.deleteVideoLibraryById(id);
  if (!deleted) {
    throw Object.assign(new Error("Categoría de videoteca no encontrada"), { status: 404 });
  }
}
