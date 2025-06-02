import "./init.ts";
import type { ActorSubclass, HttpAgentOptions } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";
import type { EncryptedMaps } from "ic_vetkd_sdk_encrypted_maps/src";
import type { _SERVICE } from "../declarations/encrypted_notes_canister.did";
import { createActor } from "../declarations/index";
import { createEncryptedMaps } from "./encrypted_maps";
import { type NoteModel, noteFromContent } from "./note.js";
import { type VaultModel, vaultFromContent } from "./vault";

export class NoteManager {
  /// The actor class representing the full interface of the canister.
  private readonly canisterClient: ActorSubclass<_SERVICE>;
  // TODO: inaccessible API are get, instert and remove
  readonly encryptedMaps: EncryptedMaps;

  constructor(
    canisterClient: ActorSubclass<_SERVICE>,
    encryptedMaps: EncryptedMaps,
  ) {
    this.canisterClient = canisterClient;
    this.encryptedMaps = encryptedMaps;
  }

  async setNote(
    owner: Principal,
    vault: string,
    noteName: string,
    cleartext: Uint8Array,
    tags: string[],
    metadata: Uint8Array,
  ): Promise<{ Ok: null } | { Err: string }> {
    const encryptedPassword = await this.encryptedMaps.encrypt_for(
      owner,
      vault,
      noteName,
      cleartext,
    );
    if ("Err" in encryptedPassword) {
      return encryptedPassword;
    }
    const maybeError =
      await this.canisterClient.insert_encrypted_value_with_metadata(
        owner,
        stringToBytebuf(vault),
        stringToBytebuf(noteName),
        { inner: encryptedPassword.Ok },
        tags,
        uint8ArrayToBytebuf(metadata),
      );
    if ("Err" in maybeError) {
      return maybeError;
    }

    return { Ok: null };
  }

  async getDecryptedVaults(
    owner: Principal,
  ): Promise<{ Ok: VaultModel[] } | { Err: string }> {
    const vaultsSharedWithMe =
      await this.encryptedMaps.get_accessible_shared_map_names();
    const vaultsOwnedByMeResult =
      await this.encryptedMaps.get_owned_non_empty_map_names();

    const vaultIds = new Array<[Principal, string]>();
    for (const vaultNameBytes of vaultsOwnedByMeResult) {
      const vaultName = new TextDecoder().decode(
        Uint8Array.from(vaultNameBytes.inner),
      );
      vaultIds.push([owner, vaultName]);
    }
    for (const [otherOwner, vaultNameBytes] of vaultsSharedWithMe) {
      const vaultName = new TextDecoder().decode(
        Uint8Array.from(vaultNameBytes.inner),
      );
      vaultIds.push([otherOwner, vaultName]);
    }

    const vaults = [];

    for (const [otherOwner, vaultName] of vaultIds) {
      const result =
        await this.canisterClient.get_encrypted_values_for_map_with_metadata(
          otherOwner,
          { inner: new TextEncoder().encode(vaultName) },
        );
      if ("Err" in result) {
        throw new Error(result.Err);
      }

      const notes = new Array<[string, NoteModel]>();
      for (const [
        noteNameBytebuf,
        encryptedData,
        noteMetadata,
        log,
      ] of result.Ok) {
        const noteNameString = new TextDecoder().decode(
          Uint8Array.from(noteNameBytebuf.inner),
        );
        const data = await this.encryptedMaps.decrypt_for(
          otherOwner,
          vaultName,
          noteNameString,
          Uint8Array.from(encryptedData.inner),
        );
        if ("Err" in data) {
          throw new Error(data.Err);
        }
        const noteContent = new TextDecoder().decode(Uint8Array.from(data.Ok));
        const note = noteFromContent(
          otherOwner,
          vaultName,
          noteNameString,
          noteContent,
          noteMetadata,
          log,
        );
        notes.push([noteNameString, note]);
      }

      const usersResult =
        await this.encryptedMaps.get_shared_user_access_for_map(
          otherOwner,
          vaultName,
        );
      if ("Err" in usersResult) {
        throw new Error(usersResult.Err);
      }

      vaults.push(
        vaultFromContent(otherOwner, vaultName, notes, usersResult.Ok),
      );
    }

    return { Ok: vaults };
  }

  async removeNote(
    owner: Principal,
    vault: string,
    noteName: string,
  ): Promise<{ Ok: null } | { Err: string }> {
    const maybeError =
      await this.canisterClient.remove_encrypted_value_with_metadata(
        owner,
        stringToBytebuf(vault),
        stringToBytebuf(noteName),
      );
    if ("Err" in maybeError) {
      return maybeError;
    }
    return { Ok: null };
  }
}

export async function createPasswordManager(
  _agentOptions?: HttpAgentOptions,
): Promise<NoteManager> {
  let agentOptions = _agentOptions;
  const { CANISTER_ID_ENCRYPTED_NOTES } = process.env;
  if (!CANISTER_ID_ENCRYPTED_NOTES) {
    console.error("CANISTER_ID_ENCRYPTED_NOTES is not defined");
    throw new Error("CANISTER_ID_ENCRYPTED_NOTES is not defined");
  }

  const host =
    process.env.DFX_NETWORK === "ic"
      ? `https://${CANISTER_ID_ENCRYPTED_NOTES}.ic0.app`
      : "http://localhost:8000";
  const hostOptions = { host };

  if (!agentOptions) {
    agentOptions = hostOptions;
  } else {
    agentOptions.host = hostOptions.host;
  }

  const encryptedMaps = await createEncryptedMaps({ ...agentOptions });
  const canisterClient = createActor(CANISTER_ID_ENCRYPTED_NOTES, {
    agentOptions,
  });

  return new NoteManager(canisterClient, encryptedMaps);
}

function stringToBytebuf(str: string): { inner: Uint8Array } {
  return { inner: new TextEncoder().encode(str) };
}

function uint8ArrayToBytebuf(buf: Uint8Array): { inner: Uint8Array } {
  return { inner: buf };
}
