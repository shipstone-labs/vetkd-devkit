<script lang="ts">
import Bold from "svelte-icons/fa/FaBold.svelte";
import Heading from "svelte-icons/fa/FaHeading.svelte";
import Italic from "svelte-icons/fa/FaItalic.svelte";
import FaListUl from "svelte-icons/fa/FaListUl.svelte";
import type { Editor } from "typewriter-editor";
import BubbleMenu from "typewriter-editor/lib/BubbleMenu.svelte";
import asRoot from "typewriter-editor/lib/asRoot.js";

export let editor: Editor;
// biome-ignore lint/style/useConst: <explanation>
export let disabled = false;

// biome-ignore lint/style/useConst: <explanation>
let classNames = "";
export { classNames as class };

function focus(el: HTMLElement) {
  el.focus();
}

$: editor.enabled = !disabled;
</script>

<BubbleMenu for={null} {editor} let:commands offset={8}>
    <div class="btn-group">
        <button class="btn btn-sm" on:click={commands.header1}>
            <span class="w-6 h-6 p-1"><Heading /></span>
        </button>
        <button class="btn btn-sm" on:click={commands.bulletList}>
            <span class="w-6 h-6 p-1"><FaListUl /></span>
        </button>
        <button class="btn btn-sm" on:click={commands.bold}>
            <span class="w-6 h-6 p-1"><Bold /></span>
        </button>
        <button class="btn btn-sm" on:click={commands.italic}>
            <span class="w-6 h-6 p-1"><Italic /></span>
        </button>
    </div>
</BubbleMenu>

<div
    use:asRoot={editor}
    class="p-4 min-h-[16rem] textarea border-base-300 {classNames} {disabled
        ? 'opacity-50'
        : ''}"
    use:focus
/>

<style>
    .textarea :global(.placeholder) {
        position: relative;
    }
    .textarea :global(.placeholder::before) {
        position: absolute;
        left: 0;
        right: 0;
        opacity: 0.75;
        content: attr(data-placeholder);
    }

    .textarea :global(h1) {
        font-size: 2rem;
        margin-bottom: 12px;
    }
    .textarea :global(ul) {
        list-style: disc;
        padding-left: 24px;
    }
</style>
