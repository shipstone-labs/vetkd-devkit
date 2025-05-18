import type { Principal } from "@dfinity/principal";
import type { NoteModel } from "./note";
import type { AccessRights } from "ic_vetkd_sdk_encrypted_maps/src";

export interface VaultModel {
  owner: Principal;
  name: string;
  notes: Array<[string, NoteModel]>;
  users: Array<[Principal, AccessRights]>;
}

export function vaultFromContent(
  owner: Principal,
  name: string,
  notes: Array<[string, NoteModel]>,
  users: Array<[Principal, AccessRights]>,
): VaultModel {
  return { owner, name, notes, users };
}

export function summarize(vault: VaultModel, maxLength = 1500) {
  const text = `Owner: ${vault.owner.toString()}, ${vault.users.length} users, ${vault.notes.length} notes.\n`;
  return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
}
