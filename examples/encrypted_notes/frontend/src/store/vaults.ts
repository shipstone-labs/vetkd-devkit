import { writable } from "svelte/store";
import type { NoteModel } from "../lib/note";
import type { VaultModel } from "../lib/vault";
import { auth } from "./auth";
import { showError } from "./notifications";
import type { AccessRights } from "ic_vetkd_sdk_encrypted_maps/src";
import type { Principal } from "@dfinity/principal";
import type { NoteManager } from "../lib/note_manager";

export const vaultsStore = writable<
  | {
      state: "uninitialized";
    }
  | {
      state: "loading";
    }
  | {
      state: "loaded";
      list: VaultModel[];
    }
  | {
      state: "error";
    }
>({ state: "uninitialized" });

let vaultPollerHandle: ReturnType<typeof setInterval> | null;

function updateVaults(vaults: VaultModel[]) {
  vaultsStore.set({
    state: "loaded",
    list: vaults,
  });
}

export async function refreshVaults(
  owner: Principal,
  noteManager: NoteManager,
) {
  const vaults = await noteManager.getDecryptedVaults(owner);
  if ("Err" in vaults) {
    throw new Error(vaults.Err);
  }
  updateVaults(vaults.Ok);
}

export async function setNote(
  parentVaultOwner: Principal,
  parentVaultName: string,
  noteName: string,
  cleartext: string,
  metadata: Uint8Array,
  tags: string[],
  noteManager: NoteManager,
) {
  const result = await noteManager.setNote(
    parentVaultOwner,
    parentVaultName,
    noteName,
    new TextEncoder().encode(cleartext),
    tags,
    metadata,
  );
  if ("Err" in result) {
    throw new Error(result.Err);
  }
}

export async function removePassword(
  note: NoteModel,
  noteManager: NoteManager,
) {
  const result = await noteManager.removeNote(
    note.owner,
    note.parentVaultName,
    note.noteName,
  );
  if ("Err" in result) {
    throw new Error(result.Err);
  }
}

export async function addUser(
  owner: Principal,
  vaultName: string,
  user: Principal,
  userRights: AccessRights,
  noteManager: NoteManager,
) {
  const result = await noteManager.encryptedMaps.set_user_rights(
    owner,
    vaultName,
    user,
    userRights,
  );
  if ("Err" in result) {
    throw new Error(result.Err);
  }
}

export async function removeUser(
  owner: Principal,
  vaultName: string,
  user: Principal,
  noteManager: NoteManager,
) {
  const result = await noteManager.encryptedMaps.remove_user(
    owner,
    vaultName,
    user,
  );
  if ("Err" in result) {
    throw new Error(result.Err);
  }
}

auth.subscribe(async ($auth) => {
  if ($auth.state === "initialized") {
    if (vaultPollerHandle !== null) {
      clearInterval(vaultPollerHandle);
      vaultPollerHandle = null;
    }

    vaultsStore.set({
      state: "loading",
    });
    try {
      await refreshVaults(
        $auth.client.getIdentity().getPrincipal(),
        $auth.noteManager,
      ).catch((e) => showError(e, "Could not poll vaults."));

      vaultPollerHandle = setInterval(async () => {
        await refreshVaults(
          $auth.client.getIdentity().getPrincipal(),
          $auth.noteManager,
        ).catch((e) => showError(e, "Could not poll vaults."));
      }, 3000);
    } catch {
      vaultsStore.set({
        state: "error",
      });
    }
  } else if ($auth.state === "anonymous" && vaultPollerHandle !== null) {
    clearInterval(vaultPollerHandle);
    vaultPollerHandle = null;
    vaultsStore.set({
      state: "uninitialized",
    });
  }
});
