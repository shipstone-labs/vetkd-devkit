<script lang="ts">
import Router from "svelte-spa-router";
import "../store/vaults";
import { wrap } from "svelte-spa-router/wrap";
import EditNote from "./EditNote.svelte";
import EditVault from "./EditVault.svelte";
import NewNote from "./NewNote.svelte";
import Note from "./Note.svelte";
import SidebarLayout from "./SidebarLayout.svelte";
import Vault from "./Vault.svelte";
import Vaults from "./Vaults.svelte";

const routes = {
  "/": wrap({ component: NewNote }),
  "/vaults": wrap({ component: Vaults }),
  "/vaults/:vaultOwner/:VaultName": wrap({ component: Vault }),
  "/edit/vaults/:vaultOwner/:VaultName": wrap({ component: EditVault }),
  "/vaults/:vaultOwner/:VaultName/:noteName": wrap({
    component: Note,
  }),
  "/edit/vaults/:vaultOwner/:VaultName/:nodeName": wrap({
    component: EditNote,
  }),
};
</script>

<SidebarLayout>
    <Router {routes} />
</SidebarLayout>
