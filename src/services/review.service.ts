import type { CreateReviewInput, ReviewStatus, UpdateReviewInput } from "../entities/Review";
import * as clientRepository from "../repositories/client.repository";
import * as reviewRepository from "../repositories/review.repository";

const REVIEW_STATUSES: ReviewStatus[] = ["upcoming", "done", "canceled"];

const REQUIRED_FIELDS: (keyof CreateReviewInput)[] = [
  "clientId",
  "title",
  "date",
  "status",
  "note",
];

function assertCreatePayload(
  body: Partial<CreateReviewInput> & Record<string, unknown>,
): void {
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

function parseReviewStatus(value: unknown): ReviewStatus {
  const status = String(value ?? "");
  if (!REVIEW_STATUSES.includes(status as ReviewStatus)) {
    throw Object.assign(
      new Error(`status debe ser uno de: ${REVIEW_STATUSES.join(", ")}`),
      { status: 400 },
    );
  }
  return status as ReviewStatus;
}

function parseOptionalReviewStatus(value: unknown): ReviewStatus | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return parseReviewStatus(value);
}

async function assertClientExists(clientId: string) {
  if (!clientId.trim()) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }
  return client;
}

/** Lista todas las revisiones. Filtro opcional por `status`. */
export async function listReviews(statusInput?: unknown) {
  const status = parseOptionalReviewStatus(statusInput);
  const filter = status ? { status } : {};
  return reviewRepository.findAllReviews(filter);
}

/** Revisiones de un cliente concreto. */
export async function getReviewsByClientId(clientId: string) {
  await assertClientExists(clientId);
  return reviewRepository.findReviewsByClient(clientId);
}

export async function getReviewById(id: string) {
  const review = await reviewRepository.findReviewById(id);
  if (!review) {
    throw Object.assign(new Error("Revisión no encontrada"), { status: 404 });
  }
  return review;
}

export async function createReview(
  body: Partial<CreateReviewInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = String(body.clientId).trim();
  await assertClientExists(clientId);

  const payload: CreateReviewInput = {
    clientId,
    title: String(body.title).trim(),
    date: String(body.date).trim(),
    status: parseReviewStatus(body.status),
    note: String(body.note ?? ""),
  };

  if (!payload.title) {
    throw Object.assign(new Error("title es obligatorio"), { status: 400 });
  }
  if (!payload.date) {
    throw Object.assign(new Error("date es obligatorio"), { status: 400 });
  }

  return reviewRepository.insertReview(payload);
}

export async function updateReview(
  id: string,
  body: UpdateReviewInput & Record<string, unknown>,
) {
  const current = await reviewRepository.findReviewById(id);
  if (!current) {
    throw Object.assign(new Error("Revisión no encontrada"), { status: 404 });
  }

  const update: UpdateReviewInput = {};

  if (body.clientId !== undefined) {
    const clientId = String(body.clientId).trim();
    await assertClientExists(clientId);
    update.clientId = clientId;
  }

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) {
      throw Object.assign(new Error("title no puede estar vacío"), { status: 400 });
    }
    update.title = title;
  }

  if (body.date !== undefined) {
    const date = String(body.date).trim();
    if (!date) {
      throw Object.assign(new Error("date no puede estar vacío"), { status: 400 });
    }
    update.date = date;
  }

  if (body.status !== undefined) {
    update.status = parseReviewStatus(body.status);
  }

  if (body.note !== undefined) {
    update.note = String(body.note);
  }

  const updated = await reviewRepository.updateReviewById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Revisión no encontrada"), { status: 404 });
  }
  return updated;
}

export async function deleteReview(id: string) {
  const deleted = await reviewRepository.deleteReviewById(id);
  if (!deleted) {
    throw Object.assign(new Error("Revisión no encontrada"), { status: 404 });
  }
}

/** Inserta revisiones demo para el primer cliente si la colección está vacía. */
export async function seedDemoReviewsIfEmpty() {
  const existing = await reviewRepository.findAllReviews();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const client = clients[0];
  if (!client) {
    console.warn("No hay cliente para seed de Review");
    return;
  }

  const clientId = client._id.toHexString();
  const demos: CreateReviewInput[] = [
    {
      clientId,
      title: "Revisión semanal · Semana 7",
      date: "Vie 23 may · 17:00",
      status: "upcoming",
      note: "Sube 4 fotos y tus medidas 24h antes.",
    },
    {
      clientId,
      title: "Revisión semanal · Semana 6",
      date: "Vie 16 may · 17:00",
      status: "done",
      note: "Completada. ¡Gran progreso en cintura!",
    },
    {
      clientId,
      title: "Revisión semanal · Semana 5",
      date: "Vie 9 may · 17:00",
      status: "done",
      note: "Completada.",
    },
  ];

  for (const demo of demos) {
    await reviewRepository.insertReview(demo);
  }

  console.log(`Revisiones demo creadas para cliente ${client.email}`);
}
