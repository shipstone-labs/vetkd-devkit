import type { Principal } from "@dfinity/principal";
import type { MetadataWrapper } from "../declarations/encrypted_notes_canister.did";

export interface NoteModel {
  owner: Principal;
  parentVaultName: string;
  noteName: string;
  content: string;
  metadata: MetadataWrapper;
}

export function noteFromContent(
  owner: Principal,
  parentVaultName: string,
  noteName: string,
  content: string,
  metadata: MetadataWrapper,
): NoteModel {
  return {
    owner,
    parentVaultName,
    noteName,
    content,
    metadata,
  };
}

export function summarize(note: NoteModel, maxLength = 50) {
  const text = note.content.replace(/<[^>]+>/, "");
  return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
}
