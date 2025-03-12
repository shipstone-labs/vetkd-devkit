import type { Principal } from "@dfinity/principal";
import type { PasswordMetadata } from "../declarations/password_manager_with_metadata.did";

export interface PasswordModel {
    owner: Principal;
    parentVaultName: string;
    passwordName: string;
    content: string;
    metadata: PasswordMetadata;
}

export function passwordFromContent(
    owner: Principal,
    parentVaultName: string,
    passwordName: string,
    content: string,
    metadata: PasswordMetadata,
): PasswordModel {
    return {
        owner,
        parentVaultName,
        passwordName,
        content,
        metadata,
    };
}

export function summarize(password: PasswordModel, maxLength = 50) {
    const div = document.createElement("div");
    div.innerHTML = password.content;

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
