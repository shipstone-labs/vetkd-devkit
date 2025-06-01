import type { Principal } from "@dfinity/principal";
import type { AccessRights } from "ic_vetkd_sdk_encrypted_maps/src";
import type { NoteModel } from "./note";
import type { AuditEntry } from "../declarations/encrypted_notes_canister.did";

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

export function accessRightsToString(ar: AccessRights) {
  const parts = [];
  if (ar.start?.length > 0) {
    const start = ar.start[0];
    if (start) {
      parts.push(
        `after ${new Date(Number(start / 1000000n)).toLocaleString()}`,
      );
    }
  }
  if (ar.end?.length > 0) {
    const end = ar.end[0];
    if (end) {
      parts.push(`before ${new Date(Number(end / 1000000n)).toLocaleString()}`);
    }
  }
  switch (Object.keys(ar.rights).at(0)) {
    case "ReadWriteManage":
      parts.push("read", "write", "manage");
      break;
    case "ReadWrite":
      parts.push("read", "write");
      break;
    case "Read":
      parts.push("read");
      break;
    default:
      throw new Error("unknown access rights");
  }
  return parts.join(", ");
}
