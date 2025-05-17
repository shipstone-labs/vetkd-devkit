<script lang="ts">
import { onDestroy } from "svelte";
import { Editor, placeholder } from "typewriter-editor";
import { noteFromContent } from "../lib/note";
import { auth } from "../store/auth";
import { draft } from "../store/draft";
import { setNote, refreshVaults } from "../store/vaults";
import { addNotification, showError } from "../store/notifications";
import Header from "./Header.svelte";
import NoteEditor from "./NoteEditor.svelte";
import { Principal } from "@dfinity/principal";

let creating = false;
// biome-ignore lint/style/useConst: Svelte mods are not seen by biome
let vaultOwner =
  $auth.state === "initialized"
    ? $auth.client.getIdentity().getPrincipal().toText()
    : Principal.anonymous().toText();
// biome-ignore lint/style/useConst: Svelte mods are not seen by biome
let vaultName = "";
// biome-ignore lint/style/useConst: Svelte mods are not seen by biome
let noteName = "";
// biome-ignore lint/style/useConst: Svelte mods are not seen by biome
let metadata = {};

// biome-ignore lint/style/useConst: Svelte mods are not seen by biome
let tagsInput = "";
let tags: string[] = [];
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

const editor = new Editor({
  modules: {
    placeholder: placeholder("Enter note..."),
  },
  html: $draft.content,
});

async function add() {
  if ($auth.state !== "initialized") {
    return;
  }

  creating = true;

  await setNote(
    Principal.fromText(vaultOwner),
    vaultName,
    noteName,
    editor.getText(),
    new TextEncoder().encode(JSON.stringify(metadata)),
    tags,
    $auth.noteManager,
  )
    .catch((e) => {
      showError(e, "Could not add note.");
    })
    .finally(() => {
      creating = false;
    });

  // if creation was successful, reset the editor
  editor.setHTML("");

  addNotification({
    type: "success",
    message: "Password added successfully",
  });

  // refresh notes in the background
  refreshVaults(
    $auth.client.getIdentity().getPrincipal(),
    $auth.noteManager,
  ).catch((e) => showError(e, "Could not refresh notes."));
}

function saveDraft() {
  draft.set({
    content: editor.getText(),
  });
}

onDestroy(saveDraft);
</script>

<svelte:window on:beforeunload={saveDraft} />

<Header>
    <span slot="title"> New note </span>
</Header>

<main class="p-4">
    <!-- Add these input fields -->
    <div class="mb-3">
        <input
            type="text"
            bind:value={vaultOwner}
            placeholder="Enter vault owner"
            class="input input-bordered w-full mb-3"
        />
        <input
            type="text"
            bind:value={vaultName}
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
            bind:value={url}
            placeholder="Enter optional URL"
            class="input input-bordered w-full"
        /> -->
        <input
            type="text"
            bind:value={tagsInput}
            on:input={handleTagsInput}
            placeholder="Enter optional tags"
            class="input input-bordered w-full"
        />
    </div>
    <NoteEditor {editor} class="mb-3" disabled={creating} />
    <button
        class="btn mt-6 btn-primary {creating ? 'loading' : ''}"
        disabled={creating}
        on:click={add}>{creating ? "Adding..." : "Add note"}</button
    >
</main>
