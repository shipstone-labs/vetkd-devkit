declare module "svelte-icons/fa/*.svelte" {
  import { SvelteComponentTyped } from "svelte";
  export default class extends SvelteComponentTyped<{
    size?: string | number;
    color?: string;
    [key: string]: unknown;
  }> {}
}
