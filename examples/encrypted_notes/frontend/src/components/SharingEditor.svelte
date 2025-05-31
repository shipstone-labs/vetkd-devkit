<script lang="ts">
import { Principal } from "@dfinity/principal";
import type { AccessRights } from "ic_vetkd_sdk_encrypted_maps/src";
import type { VaultModel } from "../lib/vault";
import { auth } from "../store/auth";
import { addNotification, showError } from "../store/notifications";
import {
  addUser,
  refreshVaults,
  removeUser,
  vaultsStore,
} from "../store/vaults";
import type { Rights } from "ic_vetkd_sdk_encrypted_maps";
import { AnonymousIdentity } from "@dfinity/agent";

export let editedVault: VaultModel;
// biome-ignore lint/style/useConst: Svelte mods don't show through
export let canManage = false;
// biome-ignore lint/style/useConst: Svelte mods don't show through
export let currentRoute = "";

let newSharingEveryone = false;
let newSharingCheckmark: HTMLButtonElement;
let newSharing = "";
let newSharingInput: HTMLInputElement;
let adding = false;
let removing = false;

async function add() {
  if ($auth.state !== "initialized") {
    throw new Error("not logged in");
  }
  adding = true;
  let rights: Rights = { Read: null };

  const selectElement = document.getElementById(
    "access-rights-select",
  ) as HTMLSelectElement;
  const selectedIndex = selectElement.selectedIndex;
  const selectedValue = selectElement.options[selectedIndex].value;

  if (selectedValue === "Read") {
  } else if (selectedValue === "ReadWrite") {
    rights = { ReadWrite: null };
  } else if (selectedValue === "ReadWriteManage") {
    rights = { ReadWriteManage: null };
  }

  const accessRights: AccessRights = {
    start: [],
    end: [],
    rights,
  };

  try {
    await addUser(
      editedVault.owner,
      editedVault.name,
      Principal.fromText(newSharing),
      accessRights,
      $auth.noteManager,
    );
    addNotification({
      type: "success",
      message: "User successfully added",
    });
    editedVault.users.push([Principal.fromText(newSharing), accessRights]);
    newSharing = "";
    newSharingInput.focus();
  } catch (e) {
    showError(e, "Could not add user.");
  } finally {
    adding = false;
  }
  await refreshVaults(
    $auth.client.getIdentity().getPrincipal(),
    $auth.noteManager,
  ).catch((e) => showError(e, "Could not refresh vaults."));
}

async function remove(sharing: Principal) {
  if ($auth.state !== "initialized") {
    throw new Error("not logged in");
  }
  removing = true;
  try {
    await removeUser(
      editedVault.owner,
      editedVault.name,
      sharing,
      $auth.noteManager,
    );
    editedVault.users = editedVault.users.filter((user) =>
      user[0].compareTo(sharing),
    );
    addNotification({
      type: "success",
      message: "User successfully removed",
    });
  } catch (e) {
    showError(e, "Could not remove user.");
  } finally {
    removing = false;
  }
  await refreshVaults(
    $auth.client.getIdentity().getPrincipal(),
    $auth.noteManager,
  ).catch((e) => showError(e, "Could not refresh vaults."));
}

function onKeyPress(e) {
  if (
    e.key === "Enter" &&
    !editedVault.users.find(
      (user) => user[0].compareTo(Principal.fromText(newSharing)) === "eq",
    )
  ) {
    add();
  }
}

function onEveryoneChanged(e: Event & { currentTarget: HTMLButtonElement }) {
  const checked = e.currentTarget.checked;
  if (checked) {
    newSharing = Principal.anonymous();
  }
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

$: {
  if ($vaultsStore.state === "loaded" && !editedVault) {
    const split = currentRoute.split("/");
    const vaultOwnewr = Principal.fromText(split[split.length - 2]);
    const vaultName = split[split.length - 1];
    const vault = $vaultsStore.list.find(
      (vault) => vault.owner === vaultOwnewr && vault.name === vaultName,
    );
    editedVault = vault;
  }
}
</script>

<p class="text-lg font-bold">Users</p>
{#if canManage}
    <p class="mt-1">
        Add users by their principal to allow them viewing or editing the vault.
    </p>
{:else}
    <p class="mt-3">
        This vault is <span class="font-bold">shared</span> with you. It is
        owned by
        <span class="italic font-bold">{editedVault.owner}</span>.
    </p>
    <p class="mt-3">Users with whom the vault is shared:</p>
{/if}
<input class="flex flex-wrap space-x-2 mt-2">
    {#each editedVault.users as sharing}
        <button
            class="btn btn-outline btn-sm flex items-center"
            on:click={() => {
                remove(sharing[0]);
            }}
            disabled={adding || removing || !canManage}
        >
            <span>{accessRightsToString(sharing[1])} {sharing[0]}</span>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="inline-block w-4 h-4 stroke-current"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
        </button>
    {/each}
    <div>
      <input
          bind:value={newSharingEveryone}
          type="checkbox"
          class="bg-transparent text-base rounded-lg h-8 px-3 w-auto {adding ||
          removing
              ? 'opacity-50'
              : ''} 
            {!canManage ? 'hidden' : ''}"
          bind:this={newSharingCheckmark}
          on:change={onEveryoneChanged}
          disabled={adding}
          id="isEveryone"
      />
      <label for="isEveryone">Everyone</label>
    </div>
    <input
        bind:value={newSharing}
        placeholder="Add principal..."
        bind:this={newSharingInput}
        class="bg-transparent text-base rounded-lg h-8 px-3 w-auto {adding ||
        removing
            ? 'opacity-50'
            : ''} 
          {!canManage ? 'hidden' : ''}"
        on:keypress={onKeyPress}
        disabled={adding || newSharingEveryone}
    />
    <select
        name="access-rights"
        id="access-rights-select"
        disabled={(newSharing !== "" &&
            !!editedVault.users.find(
                (user) =>
                    user[0].compareTo(Principal.fromText(newSharing)) === "eq",
            )) ||
            adding ||
            removing}
        hidden={!canManage}
    >
        <option value="Read">read</option>
        <option value="ReadWrite">read-write</option>
        <option value="ReadWriteManage">read-write-manage</option>
    </select>
    <button
        class="btn btn-sm btn-ghost
          {!canManage ? 'hidden' : ''}
          {adding || removing ? 'loading' : ''}"
        on:click={add}
        disabled={(newSharing !== "" &&
            !!editedVault.users.find(
                (user) =>
                    user[0].compareTo(Principal.fromText(newSharing)) === "eq",
            )) ||
            adding ||
            removing}
        >{adding ? "Adding..." : removing ? "Removing... " : "Add"}</button
    >
</div>
