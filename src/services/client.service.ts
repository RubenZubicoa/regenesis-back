import type { CreateClientInput, UpdateClientInput } from "../entities/Client";
import { toPublicClient } from "../entities/Client";
import * as clientRepository from "../repositories/client.repository";

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
  if (!client || client.contraseña !== contraseña) {
    throw Object.assign(new Error("Correo o contraseña incorrectos"), { status: 401 });
  }

  return toPublicClient(client);
}

export async function createClient(body: Partial<CreateClientInput>) {
  assertCreatePayload(body);

  const existing = await clientRepository.findClientByEmail(body.email);
  if (existing) {
    throw Object.assign(new Error("Ya existe un cliente con ese email"), { status: 409 });
  }

  const payload: CreateClientInput = {
    name: body.name,
    fullName: body.fullName,
    email: body.email,
    telefono: body.telefono,
    contraseña: body.contraseña,
    goal: body.goal,
    coach: body.coach,
    plan: body.plan,
    program: Number(body.program),
    startDate: body.startDate,
    endDate: body.endDate,
    week: body.week ?? 1,
    totalWeeks: body.totalWeeks ?? 12,
    phase: body.phase ?? 1,
    totalPhases: body.totalPhases ?? 3,
    avatar: body.avatar ?? "",
  };

  const created = await clientRepository.insertClient(payload);
  return toPublicClient(created);
}

export async function updateClient(id: string, body: UpdateClientInput) {
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
  if (update.program !== undefined) update.program = Number(update.program);
  if (update.week !== undefined) update.week = Number(update.week);
  if (update.totalWeeks !== undefined) update.totalWeeks = Number(update.totalWeeks);
  if (update.phase !== undefined) update.phase = Number(update.phase);
  if (update.totalPhases !== undefined) update.totalPhases = Number(update.totalPhases);

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

/** Inserta un cliente de demo si la colección está vacía. */
export async function seedDemoClientIfEmpty() {
  const clients = await clientRepository.findAllClients();
  if (clients.length > 0) return;

  await createClient({
    name: "Rubén",
    fullName: "Rubén Zubicoa",
    email: "ruben.zubicoa@email.com",
    telefono: "+34 612 345 678",
    contraseña: "regenesis123",
    goal: "Recomposición corporal",
    coach: "Onatz Health Coach",
    plan: "Método Regenesis",
    program: 3,
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
