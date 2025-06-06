<script lang="ts">
import { Principal } from "@dfinity/principal";
import type { AccessRights } from "ic_vetkd_sdk_encrypted_maps/src";
import { createEventDispatcher, onDestroy } from "svelte";
import GiOpenTreasureChest from "svelte-icons/gi/GiOpenTreasureChest.svelte";
import { link, location } from "svelte-spa-router";
import type { PasswordModel } from "../lib/password";
import { type VaultModel, summarize } from "../lib/vault";
import { auth } from "../store/auth";
import { vaultsStore } from "../store/vaults";
import Header from "./Header.svelte";
import Password from "./Password.svelte";
import SharingEditor from "./SharingEditor.svelte";
import Spinner from "./Spinner.svelte";

export let vault: VaultModel = {
  name: "",
  owner: Principal.managementCanister(),
  passwords: [],
  users: [],
};
export let vaultSummary = "";
export let accessRights: AccessRights = {
  start: [],
  end: [],
  rights: { Read: null },
};

export let currentRoute = "";
const unsubscribeCurrentRoute = location.subscribe((value) => {
  currentRoute = value;
});
onDestroy(unsubscribeCurrentRoute);

$: {
  if (
    $vaultsStore.state === "loaded" &&
    $auth.state === "initialized" &&
    vault.name.length === 0 &&
    currentRoute.split("/").length > 2
  ) {
    const split = currentRoute.split("/");
    const vaultOwner = Principal.fromText(split[split.length - 2]);
    const vaultName = split[split.length - 1];
    const searchedForVault = $vaultsStore.list.find(
      (v) => v.owner.compareTo(vaultOwner) === "eq" && v.name === vaultName,
    );
    if (searchedForVault) {
      vault = searchedForVault;
      vaultSummary += summarize(vault);
      const me = $auth.client.getIdentity().getPrincipal();
      accessRights =
        vault.owner.compareTo(me) === "eq"
          ? { start: [], end: [], rights: { ReadWriteManage: null } }
          : vault.users.find((user) => user[0].compareTo(me) === "eq")[1];
    } else {
      vaultSummary = `could not find vault ${vaultName} owned by ${vaultOwner.toText()}`;
    }
  }
}
</script>

<Header>
    <span slot="title" class="flex items-center gap-2 h-full">
        <span style={`width: 64px; height: 64px;`} class="inline-block">
            <GiOpenTreasureChest />
        </span>
        Vault: {vault.name}
    </span>
    <svelte:fragment slot="actions">
        {#if $vaultsStore.state === "loaded" && $vaultsStore.list.length > 0}
            <a class="btn btn-primary" href="/" use:link>New password</a>
        {/if}
    </svelte:fragment>
</Header>

<main class="p-4 pb-24 relative min-h-screen flex flex-col">
    {#if $vaultsStore.state === "loading"}
        <Spinner />
        Loading vault...
    {:else if $vaultsStore.state === "loaded"}
        <div class="pointer-events-none">
            <h2 class="text-lg font-bold mb-2 line-clamp-3">
                {vaultSummary}
            </h2>
        </div>
        <div class="mt-5"></div>
        <SharingEditor
            editedVault={vault}
            canManage={"ReadWriteManage" in accessRights.rights}
        />

        <div class="mt-5"></div>

        <div class="pointer-events-none">
            <h2 class="text-lg font-bold mb-2 line-clamp-3">
                Passwords
            </h2>
        </div>
        {#if vault.passwords.length === 0}
            <div class="text-center pt-8 italic">
                You don't have any passwords in this vault.
            </div>
            <div class="text-center pt-8">
                <a href="/" use:link class="btn btn-primary"
                    >Add a new password</a
                >
            </div>
        {:else}
            <div
                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3
            max-w-7xl"
            >
                {#each vault.passwords as password ((password[1].owner, password[1].parentVaultName, password[1].passwordName))}
                    <a
                        class="p-4 rounded-md border border-base-300 dark:border-base-300 bg-base
dark:bg-base-100 hover:-translate-y-2 transition-transform"
                        use:link
                        href={`/edit/vaults/${vault.owner}/${vault.name}/${password[1].passwordName}`}
                    >
                        <div class="pointer-events-none">
                            <h2 class="text-lg font-bold mb-2 line-clamp-3">
                                {password[1].passwordName}: "{password[1]
                                    .content}"
                            </h2>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
        <div class="flex-grow"></div>
        <div class="text-center">
            <a href={`/vaults`} use:link class="btn btn-primary">
                Back to overview
            </a>
        </div>
    {/if}
</main>
