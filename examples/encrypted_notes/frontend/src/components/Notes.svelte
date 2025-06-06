<script lang="ts">
import { link } from "svelte-spa-router";
import type { VaultModel } from "../lib/vault";
import { vaultsStore } from "../store/vaults";
import Header from "./Header.svelte";
import Password from "./Note.svelte";
import Spinner from "./Spinner.svelte";

// biome-ignore lint/style/useConst: Svelte mods don't show through
let filter = "";
let filteredVaults: VaultModel[];

$: searchIndex =
  $vaultsStore.state === "loaded"
    ? $vaultsStore.list.map((vault) => {
        const div = document.createElement("div");
        div.innerHTML = Array.from(vault.notes.values())
          .map((note) => note[0])
          .join(" xx ");
        const content = div.innerText;
        return [content].join("/#delimiter#/").toLowerCase();
      })
    : [];

$: {
  if ($vaultsStore.state === "loaded") {
    if (filter.length > 0) {
      filteredVaults = $vaultsStore.list.filter((_, i) => {
        return searchIndex[i].includes(filter.toLowerCase());
      });
    } else {
      filteredVaults = $vaultsStore.list;
    }
  }
}
</script>

<Header>
    <span slot="title"> Your notes </span>
    <svelte:fragment slot="actions">
        {#if $vaultsStore.state === "loaded" && $vaultsStore.list.length > 0}
            <a class="btn btn-primary" use:link href="/">New Password</a>
        {/if}
    </svelte:fragment>
</Header>
<main class="p-4">
    {#if $vaultsStore.state === "loading"}
        <Spinner />
        Loading notes...
    {:else if $vaultsStore.state === "loaded"}
        {#if $vaultsStore.list.length > 0}
            <div class="mb-6">
                <input
                    bind:value={filter}
                    class="bg-transparent text-base {filter.length > 0
                        ? 'border'
                        : ''} rounded-lg h-8 px-3"
                    placeholder="Filter notes..."
                />
            </div>

            <div
                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-7xl"
            >
                {#each filteredVaults as vault (vault.name)}
                    {#each Array.from(vault.notes
                            .values()
                            .map(([name, note]) => note)) as note}
                        <Password note={note} />
                    {/each}
                {/each}
            </div>
        {:else}
            <div class="text-center pt-8 italic">You don't have any notes.</div>
            <div class="text-center pt-8">
                <a href="/" use:link class="btn btn-primary">Add a note</a>
            </div>
        {/if}
    {:else if $vaultsStore.state === "error"}
        <div class="alert alert-error">Could not load notes.</div>
    {/if}
</main>
