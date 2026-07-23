import type { CreateProgramInput, UpdateProgramInput } from "../entities/Program";
import * as programRepository from "../repositories/program.repository";

const REQUIRED_FIELDS: (keyof CreateProgramInput)[] = ["name", "description"];

function assertCreatePayload(body: Partial<CreateProgramInput>): asserts body is CreateProgramInput {
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

export async function listPrograms() {
  return programRepository.findAllPrograms();
}

export async function getProgramById(id: string) {
  const program = await programRepository.findProgramById(id);
  if (!program) {
    throw Object.assign(new Error("Programa no encontrado"), { status: 404 });
  }
  return program;
}

export async function createProgram(body: Partial<CreateProgramInput>) {
  assertCreatePayload(body);

  const existing = await programRepository.findProgramByName(body.name);
  if (existing) {
    throw Object.assign(new Error("Ya existe un programa con ese nombre"), { status: 409 });
  }

  return programRepository.insertProgram({
    name: body.name,
    description: body.description,
  });
}

export async function updateProgram(id: string, body: UpdateProgramInput) {
  const current = await programRepository.findProgramById(id);
  if (!current) {
    throw Object.assign(new Error("Programa no encontrado"), { status: 404 });
  }

  if (body.name && body.name.trim() !== current.name) {
    const existing = await programRepository.findProgramByName(body.name);
    if (existing) {
      throw Object.assign(new Error("Ya existe un programa con ese nombre"), { status: 409 });
    }
  }

  const updated = await programRepository.updateProgramById(id, body);
  if (!updated) {
    throw Object.assign(new Error("Programa no encontrado"), { status: 404 });
  }
  return updated;
}

export async function deleteProgram(id: string) {
  const deleted = await programRepository.deleteProgramById(id);
  if (!deleted) {
    throw Object.assign(new Error("Programa no encontrado"), { status: 404 });
  }
}

/** Inserta los programas de demo si la colección está vacía. */
export async function seedDemoProgramsIfEmpty() {
  const programs = await programRepository.findAllPrograms();
  if (programs.length > 0) return;

  const demos: CreateProgramInput[] = [
    {
      name: "Nutrición",
      description: "Plan nutricional personalizado",
    },
    {
      name: "Entrenamiento",
      description: "Rutina y seguimiento de entrenos",
    },
    {
      name: "Nutrición + Entrenamiento",
      description: "Programa completo de recomposición",
    },
  ];

  for (const demo of demos) {
    await programRepository.insertProgram(demo);
  }

  console.log("Programas demo creados (3)");
}
