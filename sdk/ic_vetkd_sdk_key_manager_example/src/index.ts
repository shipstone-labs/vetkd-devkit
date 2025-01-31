import { Principal } from "@dfinity/principal";
import { ActorSubclass, HttpAgent } from "@dfinity/agent";
import { createActor, key_manager_example } from "./declarations/key_manager_example/index";
import { _SERVICE as _DEFAULT_KEY_MANAGER_SERVICE, AccessRights, ByteBuf } from "./declarations/key_manager_example/key_manager_example.did";
import { KeyManagerClient } from "ic_vetkd_sdk_key_manager/src/index";

export class DefaultKeyManagerClient implements KeyManagerClient {
    canisterId: string;
    actor: ActorSubclass<_DEFAULT_KEY_MANAGER_SERVICE>;

    constructor(agent: HttpAgent, canisterId: string) {
        this.canisterId = canisterId;
        this.actor = createActor(canisterId, { agent: agent });
    }

    get_accessible_shared_key_ids(): Promise<[Principal, ByteBuf][]> {
        return this.actor.get_accessible_shared_key_ids();
    }

    set_user_rights(owner: Principal, vetkey_name: string, user: Principal, user_rights: AccessRights): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }> {
        return this.actor.set_user_rights(owner, string_to_bytebuf(vetkey_name), user, user_rights);
    }

    get_user_rights(owner: Principal, vetkey_name: string, user: Principal): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }> {
        return this.actor.get_user_rights(owner, string_to_bytebuf(vetkey_name), user);
    }

    get_encryped_vetkey(key_owner: Principal, vetkey_name: string): Promise<{ 'Ok': ByteBuf } |
    { 'Err': string }> {
        // TODO
        let dummy_key = { inner: new Uint8Array(0) };
        return this.actor.get_encrypted_vetkey(key_owner, string_to_bytebuf(vetkey_name), dummy_key);
    }

    get_vetkey_verification_key(): Promise<ByteBuf> {
        return this.actor.get_vetkey_verification_key();
    }
}

function string_to_bytebuf(s: string): ByteBuf {
    return { inner: new TextEncoder().encode(s) };
}
