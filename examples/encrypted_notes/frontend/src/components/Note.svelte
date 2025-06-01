<script lang="ts">
import { Principal } from "@dfinity/principal";
import { onDestroy } from "svelte";
import { link, location } from "svelte-spa-router";
import { type NoteModel, summarize } from "../lib/note";
import { vaultsStore } from "../store/vaults";
import Header from "./Header.svelte";
import Spinner from "./Spinner.svelte";
import { accessRightsToString } from "../lib/vault";

export let currentRoute = "";
const unsubscribe = location.subscribe((value) => {
  currentRoute = decodeURI(value);
});
onDestroy(unsubscribe);

export let note: NoteModel = {
  parentVaultName: "",
  owner: Principal.anonymous(),
  noteName: "",
  content: "",
  metadata: undefined,
  log: [],
};

export let noteSummary = "";

$: {
  if (
    $vaultsStore.state === "loaded" &&
    note.noteName.length === 0 &&
    currentRoute.split("/").length > 2
  ) {
    const split = currentRoute.split("/");
    const vaultOwner = Principal.fromText(split[split.length - 3]);
    const parentVaultName = split[split.length - 2];
    const noteName = split[split.length - 1];
    const searchedForPassword = $vaultsStore.list
      .find(
        (v) =>
          v.owner.compareTo(vaultOwner) === "eq" && v.name === parentVaultName,
      )
      .notes.find((p) => p[0] === noteName);

    if (searchedForPassword) {
      note = searchedForPassword[1];
      noteSummary += summarize(note);
    } else {
      noteSummary = `could not find note ${noteName} in vault ${parentVaultName} owned by ${vaultOwner.toText()}`;
    }
  }
}
</script>

<Header>
    <span slot="title" class="flex items-center gap-2 h-full">
        Password: {note.noteName}
    </span>
    <svelte:fragment slot="actions">
        {#if $vaultsStore.state === "loaded" && $vaultsStore.list.length > 0}
            <a class="btn btn-primary" href="/" use:link>New note</a>
        {/if}
    </svelte:fragment>
</Header>

<main class="p-4 pb-24 relative min-h-screen flex flex-col">
    {#if $vaultsStore.state === "loading"}
        <Spinner />
        Loading note...
    {:else if $vaultsStore.state === "loaded"}
        {#if note.parentVaultName === ""}
            <div class="text-center pt-8 italic">
                There is no such note in this vault.
            </div>
            <div class="text-center pt-8">
                <a href="/" use:link class="btn btn-primary"
                    >Add a new note</a
                >
            </div>
        {:else}
            <div
                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-7xl"
            >
                <div class="pointer-events-none">
                    <h2 class="text-lg font-bold mb-2 line-clamp-3">
                        {note.noteName}: "{note.content}"
                    </h2>
                </div>
            </div>
        {/if}
        <!-- History Section -->
        <div class="bg-gray-100 dark:bg-base-100 p-4 rounded-lg shadow-md">
          <p class="text-lg font-bold mb-2">History</p>
          <div class="space-y-1">
            {#each note.log as entry}
              <div class="flex flex-row bg-gray-200 dark:bg-base-200 space-x-4 text-sm p-2 rounded-lg shadow-md">
                <span class="font-mono text-gray-600 dark:text-white text-xs">{new Date(Number(entry.timestamp / BigInt(1000000))).toLocaleDateString()}<br/>{new Date(Number(entry.timestamp / BigInt(1000000))).toLocaleTimeString()}</span>
                <span>
                  {entry.audit_type}
                  {entry.user?.length ? entry.user[0] : undefined}
                  {entry.access_rights?.length ? accessRightsToString(entry.access_rights[0]) : undefined}
                  {entry.caller.toString()}
                </span>
              </div>
            {/each}
          </div>
        </div>
        <div class="flex-grow"></div>
        <div class="text-center">
            <a
                href={`/vaults/${note.owner.toText()}/${note.parentVaultName}`}
                use:link
                class="btn btn-primary"
            >
                Go back to vault
            </a>
        </div>
    {/if}
</main>
