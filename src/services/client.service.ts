import { ObjectId } from "mongodb";

import type { CreateClientInput, UpdateClientInput } from "../entities/Client";
import { toPublicClient } from "../entities/Client";
import { comparePassword, hashPassword } from "../libs/bcrypt";
import * as clientRepository from "../repositories/client.repository";
import * as programRepository from "../repositories/program.repository";
import { getCurrentWeek, getTotalWeeks } from "../utils/programProgress";

const REQUIRED_FIELDS: (keyof CreateClientInput)[] = [
  "name",
  "fullName",
  "email",
  "telefono",
  "contraseña",
  "goal",
  "coach",
  "plan",
  "program",
  "startDate",
  "endDate",
];

function assertCreatePayload(body: Partial<CreateClientInput>): asserts body is CreateClientInput {
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

function parseProgramId(value: unknown): ObjectId {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }
  throw Object.assign(new Error("Id de programa inválido"), { status: 400 });
}

async function assertProgramExists(programId: ObjectId) {
  const program = await programRepository.findProgramById(programId.toHexString());
  if (!program) {
    throw Object.assign(new Error("Programa no encontrado"), { status: 400 });
  }
  return program;
}

export async function listClients() {
  const clients = await clientRepository.findAllClients();
  return clients.map(toPublicClient);
}

export async function getClientById(id: string) {
  const client = await clientRepository.findClientById(id);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }
  return toPublicClient(client);
}

export async function loginClient(email: string, contraseña: string) {
  if (!email?.trim() || !contraseña) {
    throw Object.assign(new Error("Introduce tu correo y contraseña"), { status: 400 });
  }

  const client = await clientRepository.findClientByEmail(email);
  if (!client || !(await comparePassword(contraseña, client.contraseña))) {
    throw Object.assign(new Error("Correo o contraseña incorrectos"), { status: 401 });
  }

  return toPublicClient(client);
}

export async function createClient(body: Partial<CreateClientInput> & { program?: unknown }) {
  assertCreatePayload(body as Partial<CreateClientInput>);

  const existing = await clientRepository.findClientByEmail(body.email!);
  if (existing) {
    throw Object.assign(new Error("Ya existe un cliente con ese email"), { status: 409 });
  }

  const programId = parseProgramId(body.program);
  await assertProgramExists(programId);

  const payload: CreateClientInput = {
    name: body.name!,
    fullName: body.fullName!,
    email: body.email!,
    telefono: body.telefono!,
    contraseña: await hashPassword(body.contraseña!),
    goal: body.goal!,
    coach: body.coach!,
    plan: body.plan!,
    program: programId,
    startDate: body.startDate!,
    endDate: body.endDate!,
    week: getCurrentWeek(body.startDate!, body.endDate!),
    totalWeeks: getTotalWeeks(body.startDate!, body.endDate!),
    phase: body.phase ?? 1,
    totalPhases: body.totalPhases ?? 3,
    avatar: body.avatar ?? "",
  };

  const created = await clientRepository.insertClient(payload);
  return toPublicClient(created);
}

export async function updateClient(id: string, body: UpdateClientInput & { program?: unknown }) {
  const current = await clientRepository.findClientById(id);
  if (!current) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  if (body.email && body.email.trim().toLowerCase() !== current.email) {
    const existing = await clientRepository.findClientByEmail(body.email);
    if (existing) {
      throw Object.assign(new Error("Ya existe un cliente con ese email"), { status: 409 });
    }
  }

  const update: UpdateClientInput = { ...body };
  if (typeof body.contraseña === "string" && body.contraseña.length > 0) {
    update.contraseña = await hashPassword(body.contraseña);
  } else {
    delete update.contraseña;
  }
  if (body.program !== undefined) {
    const programId = parseProgramId(body.program);
    await assertProgramExists(programId);
    update.program = programId;
  }
  if (update.phase !== undefined) update.phase = Number(update.phase);
  if (update.totalPhases !== undefined) update.totalPhases = Number(update.totalPhases);

  const nextStart = String(update.startDate ?? current.startDate);
  const nextEnd = String(update.endDate ?? current.endDate);
  update.week = getCurrentWeek(nextStart, nextEnd);
  update.totalWeeks = getTotalWeeks(nextStart, nextEnd);

  const updated = await clientRepository.updateClientById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }
  return toPublicClient(updated);
}

export async function deleteClient(id: string) {
  const deleted = await clientRepository.deleteClientById(id);
  if (!deleted) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }
}

const LEGACY_PROGRAM_NAMES: Record<number, string> = {
  1: "Nutrición",
  2: "Entrenamiento",
  3: "Nutrición + Entrenamiento",
};

/** Si un cliente aún tiene `program` numérico (legado), lo sustituye por el ObjectId real. */
export async function migrateClientProgramRefs() {
  const clients = await clientRepository.findAllClients();

  for (const client of clients) {
    const rawProgram = client.program as unknown;
    if (rawProgram instanceof ObjectId) continue;
    if (typeof rawProgram === "string" && ObjectId.isValid(rawProgram)) {
      await clientRepository.updateClientById(client._id.toHexString(), {
        program: new ObjectId(rawProgram),
      });
      continue;
    }

    if (typeof rawProgram === "number") {
      const name = LEGACY_PROGRAM_NAMES[rawProgram];
      if (!name) continue;
      const program = await programRepository.findProgramByName(name);
      if (!program) continue;
      await clientRepository.updateClientById(client._id.toHexString(), {
        program: program._id,
      });
      console.log(`Cliente ${client.email}: program migrado a ${program._id.toHexString()}`);
    }
  }
}

/** Inserta un cliente de demo si la colección está vacía. */
export async function seedDemoClientIfEmpty() {
  const clients = await clientRepository.findAllClients();
  if (clients.length > 0) return;

  const program =
    (await programRepository.findProgramByName("Nutrición + Entrenamiento")) ??
    (await programRepository.findAllPrograms())[0];

  if (!program) {
    console.warn("No hay programas para asignar al cliente demo");
    return;
  }

  await createClient({
    name: "Rubén",
    fullName: "Rubén Zubicoa",
    email: "ruben.zubicoa@email.com",
    telefono: "+34 612 345 678",
    contraseña: "regenesis123",
    goal: "Recomposición corporal",
    coach: "Onatz Health Coach",
    plan: "Método Regenesis",
    program: program._id,
    startDate: "2026-06-11",
    endDate: "2026-09-03",
    week: 6,
    totalWeeks: 12,
    phase: 2,
    totalPhases: 3,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  });

  console.log("Cliente demo creado (ruben.zubicoa@email.com / regenesis123)");
}
