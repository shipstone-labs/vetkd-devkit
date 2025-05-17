<script lang="ts">
import { replace, location, link } from "svelte-spa-router";
import { Editor, placeholder } from "typewriter-editor";
import type { NoteModel } from "../lib/note";
import { vaultsStore, refreshVaults, setNote } from "../store/vaults";
import Header from "./Header.svelte";
import PasswordEditor from "./NoteEditor.svelte";
import Trash from "svelte-icons/fa/FaTrash.svelte";
import { addNotification, showError } from "../store/notifications";
import { auth } from "../store/auth";
import Spinner from "./Spinner.svelte";
import { onDestroy } from "svelte";
import { Principal } from "@dfinity/principal";
import type { AccessRights } from "ic_vetkd_sdk_encrypted_maps";

export let currentRoute = "";
const unsubscribe = location.subscribe((value) => {
  currentRoute = decodeURI(value);
});
onDestroy(unsubscribe);

export let parentVaultOwner = "";
let parentVaultOwnerPrincipal = Principal.managementCanister();
export let parentVaultName = "";
export let noteName = "";
export let metadata = {};
let tagsInput = "";
export let tags: string[] = [];

let originalNote: NoteModel;

let editor: Editor;
let updating = false;
let deleting = false;
let accessRights: AccessRights = { Read: null };

// Convert between string and array when the input changes
export function handleTagsInput() {
  // Split the input string by commas, trim whitespace, and filter empty strings
  tags = [
    ...new Set(
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ""),
    ),
  ];
}

async function save() {
  if (
    $auth.state !== "initialized" ||
    $vaultsStore.state !== "loaded" ||
    parentVaultOwner.length === 0 ||
    !originalNote
  ) {
    return;
  }

  let move = false;

  if (
    parentVaultName !== originalNote.parentVaultName ||
    parentVaultOwnerPrincipal.compareTo(originalNote.owner) !== "eq"
  ) {
    move = true;
    // user should have access in the new vault
    const vault = $vaultsStore.list.find(
      (v) =>
        v.owner.compareTo(parentVaultOwnerPrincipal) === "eq" &&
        v.name === parentVaultName,
    );
    const me = $auth.client.getIdentity().getPrincipal();
    if (
      parentVaultOwnerPrincipal.compareTo(me) !== "eq" &&
      (!vault ||
        !vault.users.find((u) => u[0].compareTo(me) === "eq") ||
        "Read" in vault.users.find((u) => u[0].compareTo(me) === "eq")[1])
    ) {
      addNotification({
        type: "error",
        message: "unauthorized",
      });
      return;
    }
  } else if (noteName !== originalNote.noteName) {
    move = true;
  } else {
    move = false;
  }
  const html = editor.getText();
  updating = true;

  if (move) {
    await $auth.noteManager
      .removeNote(
        originalNote.owner,
        originalNote.parentVaultName,
        originalNote.noteName,
      )
      .catch((e) => {
        deleting = false;
        showError(e, "Could not delete note for moving it.");
        return;
      });

    await setNote(
      parentVaultOwnerPrincipal,
      parentVaultName,
      noteName,
      html,
      new TextEncoder().encode(JSON.stringify(metadata)),
      tags,
      $auth.noteManager,
    )
      .catch((e) => {
        showError(e, "Could not update note.");
      })
      .finally(() => {
        updating = false;
      });
  } else {
    await setNote(
      parentVaultOwnerPrincipal,
      parentVaultName,
      noteName,
      html,
      new TextEncoder().encode(JSON.stringify(metadata)),
      tags,
      $auth.noteManager,
    )
      .catch((e) => {
        showError(e, "Could not update note.");
      })
      .finally(() => {
        updating = false;
      });
  }

  addNotification({
    type: "success",
    message: "Password saved successfully",
  });

  await refreshVaults(
    $auth.client.getIdentity().getPrincipal(),
    $auth.noteManager,
  ).catch((e) => showError(e, "Could not refresh notes."));

  if (move) {
    replace(`/edit/vaults/${parentVaultOwner}/${parentVaultName}/${noteName}`);
  }
}

async function deleteNote() {
  if ($auth.state !== "initialized") {
    return;
  }
  deleting = true;
  await $auth.noteManager
    .removeNote(parentVaultOwnerPrincipal, parentVaultName, noteName)
    .catch((e) => {
      deleting = false;
      showError(e, "Could not delete note.");
    });

  await refreshVaults(
    $auth.client.getIdentity().getPrincipal(),
    $auth.noteManager,
  )
    .catch((e) => showError(e, "Could not refresh notes."))
    .finally(() => {
      addNotification({
        type: "success",
        message: "Note deleted successfully",
      });
      replace("/vaults");
    });
}

$: {
  if (
    $vaultsStore.state === "loaded" &&
    noteName.length === 0 &&
    currentRoute.split("/").length > 2 &&
    $auth.state === "initialized"
  ) {
    const split = currentRoute.split("/");
    parentVaultOwner = split[split.length - 3];
    parentVaultOwnerPrincipal = Principal.fromText(parentVaultOwner);
    parentVaultName = split[split.length - 2];
    noteName = split[split.length - 1];
    const searchedForPassword = $vaultsStore.list
      .find(
        (v) =>
          v.owner.compareTo(Principal.fromText(parentVaultOwner)) === "eq" &&
          v.name === parentVaultName,
      )
      .notes.find((p) => p[0] === noteName);

    if (searchedForPassword) {
      originalNote = { ...searchedForPassword[1] };
      try {
        metadata = JSON.parse(
          new TextDecoder().decode(
            new Uint8Array([...originalNote.metadata.metadata]),
          ),
        );
      } catch {
        metadata = {};
      }
      tags = originalNote.metadata.tags;
      tagsInput = tags.join(", ");
    }

    const myPrincipal = $auth.client.getIdentity().getPrincipal();
    accessRights =
      parentVaultOwnerPrincipal.compareTo(myPrincipal) === "eq"
        ? { ReadWriteManage: null }
        : $vaultsStore.list
            .find(
              (v) =>
                v.owner.compareTo(parentVaultOwnerPrincipal) === "eq" &&
                v.name === parentVaultName,
            )
            .users.find((u) => u[0].compareTo(myPrincipal) === "eq")[1];
    editor = new Editor({
      modules: {
        placeholder: placeholder("Start typing..."),
      },
      html: originalNote.content,
    });
  }
}
</script>

{#if parentVaultName.length > 0}
    <Header>
        <span slot="title"> Edit note </span>
        <button
            slot="actions"
            class="btn btn-ghost {deleting ? 'loading' : ''} {!!accessRights[
                'Read'
            ]}
                ? 'hidden'
                : ''}"
            on:click={deleteNote}
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
            <div class="mb-3">
                <input
                    type="text"
                    bind:value={parentVaultOwner}
                    placeholder="Enter vault owner"
                    class="input input-bordered w-full mb-3"
                />
                <input
                    type="text"
                    bind:value={parentVaultName}
                    placeholder="Enter vault name"
                    class="input input-bordered w-full"
                />
                <input
                    type="text"
                    bind:value={noteName}
                    placeholder="Enter note name"
                    class="input input-bordered w-full"
                />
                <!-- <input
                    type="text"
                    bind:value={metadata}
                    placeholder="Enter optional URL"
                    class="input input-bordered w-full"
                /> -->
                <input
                    type="text"
                    bind:value={tagsInput}
                    on:input={handleTagsInput}
                    placeholder="Enter optional tags (comma-separated)"
                    class="input input-bordered w-full"
                />
            </div>
            <PasswordEditor
                {editor}
                disabled={updating || deleting}
                class="mb-3"
            />
            <div class="mb-1 text-sm text-gray-500">
                Created: {new Date(
                    Number(originalNote.metadata.creation_date) / 1000000,
                )}
            </div>
            <div class="mb-1 text-sm text-gray-500">
                Last modified: {new Date(
                    Number(originalNote.metadata.last_modification_date) /
                        1000000,
                )}
            </div>
            <div class="mb-1 text-sm text-gray-500">
                Number of modifications: {originalNote.metadata
                    .number_of_modifications}
            </div>
            <div class="mb-1 text-sm text-gray-500">
                Last modification by: {originalNote.metadata.last_modified_principal.toText()}
            </div>
            <a
                href={`/vaults/${parentVaultOwner}/${parentVaultName}`}
                use:link
                class="btn btn-primary"
            >
                Back
            </a>

            <button
                class="btn mt-4 btn-primary {updating ? 'loading' : ''}"
                disabled={updating || deleting}
                on:click={save}>{updating ? "Saving..." : "Save"}</button
            >
            <hr class="mt-10" />
        {:else if $vaultsStore.state === "loading"}
            Loading note...
        {/if}
    </main>
{:else}
    <Header>
        <span slot="title"> Edit note </span>
    </Header>
    <main class="p-4">
        {#if $vaultsStore.state === "loading"}
            <Spinner />
            Loading note...
        {:else if $vaultsStore.state === "loaded"}
            <div class="alert alert-error">Could not find note.</div>
        {/if}
    </main>
{/if}
