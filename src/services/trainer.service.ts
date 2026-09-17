import { toPublicTrainer } from "../entities/Trainer";
import { comparePassword, hashPassword } from "../libs/bcrypt";
import { signToken } from "../libs/jwt";
import * as trainerRepository from "../repositories/trainer.repository";

export async function loginTrainer(email: string, contraseña: string) {
  if (!email?.trim() || !contraseña) {
    throw Object.assign(new Error("Introduce tu correo y contraseña"), { status: 400 });
  }

  const trainer = await trainerRepository.findTrainerByEmail(email);
  if (!trainer || !(await comparePassword(contraseña, trainer.contraseña))) {
    throw Object.assign(new Error("Correo o contraseña incorrectos"), { status: 401 });
  }

  return {
    token: signToken({
      sub: trainer._id.toHexString(),
      email: trainer.email,
      role: "trainer",
    }),
    trainer: toPublicTrainer(trainer),
  };
}

export async function createTrainer(body: { email?: string; contraseña?: string; password?: string }) {
  const email = String(body.email ?? "").trim();
  const contraseña = body.contraseña ?? body.password ?? "";

  if (!email || !contraseña) {
    throw Object.assign(new Error("Faltan campos obligatorios: email, contraseña"), { status: 400 });
  }

  const existing = await trainerRepository.findTrainerByEmail(email);
  if (existing) {
    throw Object.assign(new Error("Ya existe un entrenador con ese email"), { status: 409 });
  }

  const created = await trainerRepository.insertTrainer({
    email,
    contraseña: await hashPassword(contraseña),
  });

  return toPublicTrainer(created);
}

/** Inserta un entrenador demo si la colección está vacía. */
export async function seedDemoTrainerIfEmpty() {
  const trainers = await trainerRepository.findAllTrainers();
  if (trainers.length > 0) return;

  await createTrainer({
    email: "entrenador@regenesis.com",
    contraseña: "regenesis123",
  });

  console.log("Entrenador demo creado (entrenador@regenesis.com / regenesis123)");
}
