/**
 * Añade imageUrl y explanation a los ejercicios existentes en RoutineDay.
 * Uso: npx tsx scripts/seed-exercise-media.ts
 */
import "dotenv/config";

import { run, database, clientDB } from "../src/db/database";
import { ROUTINE_DAY_COLLECTION } from "../src/entities/RoutineDay";

const MEDIA_BY_NAME: Record<string, { imageUrl: string; explanation: string }> = {
  "Press banca": {
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop",
    explanation:
      "Acuéstate en el banco con los pies firmes en el suelo. Baja la barra controlada hasta el pecho y empuja hacia arriba sin arquear la espalda en exceso. Escápulas retraídas y muñecas alineadas.",
  },
  "Remo con barra": {
    imageUrl: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=400&fit=crop",
    explanation:
      "Inclina el torso ~45°, espalda neutra. Tira de la barra hacia el abdomen bajo, apretando los omóplatos. Evita balancear el cuerpo: el movimiento debe salir de la espalda.",
  },
  "Press militar": {
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop",
    explanation:
      "De pie, core activo. Empuja la barra desde los hombros hacia arriba hasta extender los brazos. Baja con control. No arquees la lumbar: aprieta glúteos y abdomen.",
  },
  "Curl bíceps": {
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef0631f4db?w=400&h=400&fit=crop",
    explanation:
      "Codos pegados al torso. Sube el peso flexionando el codo sin balancear el tronco. Baja despacio. Mantén las muñecas neutras durante todo el recorrido.",
  },
  Sentadilla: {
    imageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=400&fit=crop",
    explanation:
      "Pies a la anchura de hombros, pecho alto. Baja como si te sentaras en una silla, rodillas siguiendo la dirección de los pies. Empuja el suelo para subir. Core firme.",
  },
  "Peso muerto rumano": {
    imageUrl: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=400&fit=crop",
    explanation:
      "Piernas casi extendidas, bisagra de cadera. Baja la barra rozando los muslos con espalda recta. Siente el estiramiento en isquios y vuelve empujando la cadera hacia delante.",
  },
  Zancadas: {
    imageUrl: "https://images.unsplash.com/photo-1434682881908-b43d0e9dff48?w=400&h=400&fit=crop",
    explanation:
      "Da un paso largo hacia delante y baja hasta que ambas rodillas formen ~90°. El torso permanece erguido. Empuja con el talón delantero para volver. Alterna piernas.",
  },
  Gemelos: {
    imageUrl: "https://images.unsplash.com/photo-1599058945522-28d584b6f14f?w=400&h=400&fit=crop",
    explanation:
      "De pie sobre el borde de un escalón o en máquina. Sube de puntillas al máximo y baja controlado hasta estirar el gemelo. Evita rebotar en la parte baja.",
  },
  "Hip thrust": {
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop",
    explanation:
      "Espalda apoyada en el banco, barra sobre las caderas. Empuja la cadera hacia arriba hasta alinear torso y muslos. Aprieta glúteos arriba y baja sin perder el control.",
  },
  "Dominadas asistidas": {
    imageUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=400&fit=crop",
    explanation:
      "Agarre pronado, hombros activos. Tira del cuerpo hacia arriba hasta que la barbilla pase la barra, y baja con control. Usa la asistencia necesaria para completar las reps con buena forma.",
  },
  Fondos: {
    imageUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=400&fit=crop",
    explanation:
      "En paralelas o banco, baja flexionando codos hasta ~90° y empuja para subir. Mantén el pecho ligeramente inclinado hacia delante y los hombros lejos de las orejas.",
  },
  Plancha: {
    imageUrl: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=400&fit=crop",
    explanation:
      "Apoya antebrazos y puntas de los pies. Cuerpo en línea recta: no dejes caer ni subir la cadera. Aprieta abdomen y glúteos. Respira de forma constante.",
  },
  "Elevaciones de piernas": {
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
    explanation:
      "Tumbado o colgado, sube las piernas con control usando el abdomen (no el impulso). Baja despacio sin archivar la lumbar. Mantén la pelvis estable.",
  },
  "Rueda abdominal": {
    imageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=400&h=400&fit=crop",
    explanation:
      "De rodillas, rueda hacia delante extendiendo los brazos sin perder la tensión del core. Vuelve empujando el suelo con los brazos. No dejes caer la lumbar.",
  },
  "Carrera continua": {
    imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=400&fit=crop",
    explanation:
      "Mantén un ritmo cómodo y constante. Postura erguida, zancada natural y respiración rítmica. Si es necesario, combina trote y caminata para completar la distancia.",
  },
  "Cinta / HIIT": {
    imageUrl: "https://images.unsplash.com/photo-1538805060514-733d3e042d9d?w=400&h=400&fit=crop",
    explanation:
      "Alterna intervalos intensos (p. ej. 30–45 s rápidos) con recuperación activa. Sujétate solo si lo necesitas. Prioriza técnica de carrera y control de la respiración.",
  },
};

async function main() {
  await run();

  const col = database.collection(ROUTINE_DAY_COLLECTION);
  const days = await col.find({}).toArray();
  let updatedDays = 0;
  let updatedExercises = 0;

  for (const day of days) {
    const exercises = Array.isArray(day.exercises) ? day.exercises : [];
    let changed = false;
    const next = exercises.map((ex: { name?: string; imageUrl?: string; explanation?: string }) => {
      const media = MEDIA_BY_NAME[String(ex.name ?? "")];
      if (!media) return ex;
      changed = true;
      updatedExercises += 1;
      return { ...ex, imageUrl: media.imageUrl, explanation: media.explanation };
    });

    if (changed) {
      await col.updateOne({ _id: day._id }, { $set: { exercises: next } });
      updatedDays += 1;
      console.log(`Actualizado ${day.day ?? day._id}`);
    }
  }

  console.log(`Listo. Días: ${updatedDays}, ejercicios: ${updatedExercises}`);
  await clientDB.close();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await clientDB.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
