<script lang="ts">
import Trash from "svelte-icons/fa/FaTrash.svelte";
import { Editor, placeholder } from "typewriter-editor";
import type { VaultModel } from "../lib/vault";
import { auth } from "../store/auth";
import { addNotification, showError } from "../store/notifications";
import { refreshVaults, vaultsStore } from "../store/vaults";
import Header from "./Header.svelte";
import SharingEditor from "./SharingEditor.svelte";
import Spinner from "./Spinner.svelte";

// biome-ignore lint/style/useConst: Svelte mods are not seen by biome
export let currentRoute = "";

let editedVault: VaultModel;
let editor: Editor;
let updating = false;
// biome-ignore lint/style/useConst: Svelte mods are not seen by biome
let deleting = false;
let canManage: boolean;

async function save() {
  if ($auth.state !== "initialized") {
    return;
  }
  const html = editor.getText();
  updating = true;

  addNotification({
    type: "success",
    message: "Vault saved successfully",
  });

  await refreshVaults(
    $auth.client.getIdentity().getPrincipal(),
    $auth.noteManager,
  ).catch((e) => showError(e, "Could not refresh notes."));
}

function deleteVault() {}

$: {
  if (
    $auth.state === "initialized" &&
    $vaultsStore.state === "loaded" &&
    !editedVault
  ) {
    const vault = $vaultsStore.list.find(
      (vault) => vault.name === currentRoute,
    );

    if (vault) {
      editedVault = { ...vault };
      editor = new Editor({
        modules: {
          placeholder: placeholder("Start typing..."),
        },
      });
      const me = $auth.client.getIdentity().getPrincipal();
      canManage =
        vault.owner.compareTo(me) === "eq" ||
        "ReadWriteManage" in
          (vault.users.find(([p, r]) => p.compareTo(me) === "eq")?.[1]
            ?.rights ?? {});
      console.log({
        owner: vault.owner,
        me,
        canManage,
        users: vault.owner,
      });
    }
  }
}
</script>

{#if editedVault}
    <Header>
        <span slot="title"> Edit vault </span>
        <button
            slot="actions"
            class="btn btn-ghost {deleting ? 'loading' : ''} {!canManage
                ? 'hidden'
                : ''}"
            on:click={deleteVault}
            disabled={updating || deleting}
        >
            {#if !deleting}
                <span class="w-6 h-6 p-1"><Trash /></span>
            {/if}

            {deleting ? "Deleting..." : ""}
        </button>
    </Header>
    <main class="p-4">
        {#if $vaultsStore.state === "loaded"}
            <hr class="mt-10" />
            <SharingEditor {editedVault} {canManage} />
        {:else if $vaultsStore.state === "loading"}
            Loading vaults...
        {/if}
    </main>
{:else}
    <Header>
        <span slot="title"> Edit vault </span>
    </Header>
    <main class="p-4">
        {#if $vaultsStore.state === "loading"}
            <Spinner />
            Loading vault...
        {:else if $vaultsStore.state === "loaded"}
            <div class="alert alert-error">Could not find vault.</div>
        {/if}
    </main>
{/if}
