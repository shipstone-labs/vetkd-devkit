import type { Principal } from "@dfinity/principal";
import type { PasswordModel } from "./password";
import type { AccessRights } from "ic_vetkd_sdk_encrypted_maps/src";

export interface VaultModel {
  owner: Principal;
  name: string;
  passwords: Array<[string, PasswordModel]>;
  users: Array<[Principal, AccessRights]>;
}

export function vaultFromContent(
  owner: Principal,
  name: string,
  passwords: Array<[string, PasswordModel]>,
  users: Array<[Principal, AccessRights]>,
): VaultModel {
  return { owner, name, passwords, users };
}

export function summarize(vault: VaultModel, maxLength = 1500) {
  const div = document.createElement("div");

  div.innerHTML +=
    "Owner: " + vault.owner.toString() + ", " + vault.users.length + " users";
  div.innerHTML += ", " + vault.passwords.length + " passwords.\n";

  let text = div.innerText;
  const title = extractTitleFromDomEl(div);
  if (title) {
    text = text.replace(title, "");
  }

  return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
}

function extractTitleFromDomEl(el: HTMLElement) {
  const title = el.querySelector("h1");
  if (title) {
    return title.innerText;
  }

  const blockElements = el.querySelectorAll(
    "h1,h2,p,li",
  ) as NodeListOf<HTMLElement>;
  for (const el of blockElements) {
    if (el.innerText?.trim().length > 0) {
      return el.innerText.trim();
    }
  }
  return "";
}

export function extractTitle(html: string) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return extractTitleFromDomEl(div);
}
