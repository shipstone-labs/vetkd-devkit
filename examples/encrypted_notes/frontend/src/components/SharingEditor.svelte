<script lang="ts">
import { Principal } from "@dfinity/principal";
import type { AccessRights } from "ic_vetkd_sdk_encrypted_maps/src";
import { accessRightsToString, type VaultModel } from "../lib/vault";
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

// biome-ignore lint/style/useConst: <explanation>
let newSharingEveryone = false;
let newSharingCheckmark: HTMLInputElement;
let newSharing = "";
let newSharingInput: HTMLInputElement;
let adding = false;
let removing = false;
// biome-ignore lint/style/useConst: <explanation>
let newSharingStart = false;
// biome-ignore lint/style/useConst: <explanation>
let newSharingEnd = false;
// biome-ignore lint/style/useConst: <explanation>
let newSharingStartDate = "";
// biome-ignore lint/style/useConst: <explanation>
let newSharingEndDate = "";

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
    start: newSharingStart
      ? [BigInt(new Date(newSharingStartDate).getDate()) * 1000000n]
      : [],
    end: newSharingEnd
      ? [BigInt(new Date(newSharingEndDate).getDate()) * 1000000n]
      : [],
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

function onEveryoneChanged(e: Event & { currentTarget: HTMLInputElement }) {
  const checked =
    "checked" in e.currentTarget ? e.currentTarget.checked : false;
  newSharingEveryone = checked;
  if (checked) {
    newSharing = Principal.anonymous().toString();
  }
}

$: {
  if ($vaultsStore.state === "loaded" && !editedVault) {
    const split = currentRoute.split("/");
    const vaultOwner = Principal.fromText(split[split.length - 2]);
    const vaultName = split[split.length - 1];
    const vault = $vaultsStore.list.find(
      (vault) => vault.owner === vaultOwner && vault.name === vaultName,
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
<div class="flex flex-wrap space-x-2 mt-2">
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
    <div class="flex items-center">
      <input
          bind:checked={newSharingEveryone}
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
      <label for="isEveryone">&nbsp;Everyone</label>
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
    <div class="flex items-center">
      <input
          bind:checked={newSharingStart}
          type="checkbox"
          class="bg-transparent text-base rounded-lg h-8 px-3 w-auto {adding ||
          removing
              ? 'opacity-50'
              : ''} 
            {!canManage ? 'hidden' : ''}"
          disabled={adding}
          id="hasAfter"
      />
      <label for="hasBefore">&nbsp;After</label>
      <input 
        bind:value={newSharingStartDate}
        type="datetime-local"
        class="bg-transparent text-base rounded-lg h-8 px-3 w-auto {adding ||
        removing
            ? 'opacity-50'
            : ''} 
          {!canManage || !newSharingStart ? 'hidden' : ''}"
      />
    </div>
    <div class="flex items-center">
      <input
          bind:checked={newSharingEnd}
          type="checkbox"
          class="bg-transparent text-base rounded-lg h-8 px-3 w-auto {adding ||
          removing
              ? 'opacity-50'
              : ''} 
            {!canManage ? 'hidden' : ''}"
          disabled={adding}
          id="hasEnd"
      />
      <label for="hasEnd">&nbsp;Before</label>
      <input 
        bind:value={newSharingStartDate}
        type="datetime-local"
        class="bg-transparent text-base rounded-lg h-8 px-3 w-auto {adding ||
        removing
            ? 'opacity-50'
            : ''} 
          {!canManage || !newSharingEnd ? 'hidden' : ''}"
      />
    </div>
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
