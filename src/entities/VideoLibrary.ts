import { ObjectId } from "mongodb";

export type VideoLibraryItem = {
    title: string;
    type: 'Vídeo' | 'PDF';
    length: string;
    phase: number;
    url: string;
};

export type VideoLibraryCategory = {
    _id: ObjectId;
    category: string;
    icon: string;
    tone: 'gold' | 'primary' | 'purple';
    items: VideoLibraryItem[];
};

export const VIDEO_LIBRARY_COLLECTION = "VideoLibrary";

/** Datos para crear una categoría de videoteca (sin `_id`). */
export type CreateVideoLibraryInput = Omit<VideoLibraryCategory, "_id">;

/** Datos parciales para actualizar una categoría de videoteca. */
export type UpdateVideoLibraryInput = Partial<CreateVideoLibraryInput>;

