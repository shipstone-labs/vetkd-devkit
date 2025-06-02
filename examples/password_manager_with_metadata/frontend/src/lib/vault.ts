import type { Principal } from "@dfinity/principal";
import type { AccessRights } from "ic_vetkd_sdk_encrypted_maps/src";
import type { PasswordModel } from "./password";

export interface VaultModel {
  owner: Principal;
  name: string;
  passwords: Array<[string, PasswordModel]>;
  users: Array<[Principal, AccessRights]>;
}

export function vaultFromContent(
  owner: Principal,
  name: string,
  passwords: Array<[string, PasswordModel]>,
  users: Array<[Principal, AccessRights]>,
): VaultModel {
  return { owner, name, passwords, users };
}

export function summarize(vault: VaultModel, maxLength = 1500) {
  const text = `Owner: ${vault.owner.toString()}, ${vault.users.length} users, ${vault.passwords.length} passwords.\n`;

  return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
}
