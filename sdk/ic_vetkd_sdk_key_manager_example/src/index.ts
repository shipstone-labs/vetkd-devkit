import { Principal } from "@dfinity/principal";
import { ActorSubclass, HttpAgent } from "@dfinity/agent";
import { createActor } from "./declarations/key_manager_example/index.js";
import { _SERVICE as _DEFAULT_KEY_MANAGER_SERVICE, AccessRights, ByteBuf } from "./declarations/key_manager_example/key_manager_example.did.js";
import { KeyManagerClient } from "ic_vetkd_sdk_key_manager/src/index.js";
import { TransportSecretKey } from "ic-vetkd-cdk-utils/ic_vetkd_cdk_utils.js";

export class DefaultKeyManagerClient implements KeyManagerClient {
    canisterId: string;
    actor: ActorSubclass<_DEFAULT_KEY_MANAGER_SERVICE>;
    verification_key: ByteBuf | undefined = undefined;

    constructor(agent: HttpAgent, canisterId: string) {
        this.canisterId = canisterId;
        this.actor = createActor(canisterId, { agent });
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

    async get_vetkey(key_owner: Principal, vetkey_name: string): Promise<{ 'Ok': ByteBuf } |
    { 'Err': string }> {
        // create a random transport key
        const seed = window.crypto.getRandomValues(new Uint8Array(32));
        const tsk = new TransportSecretKey(seed);
        const tpb = { inner: tsk.public_key() };
        const vetkey_name_bytes = string_to_bytebuf(vetkey_name);
        const encrypted_vetkey = await this.actor.get_encrypted_vetkey(key_owner, vetkey_name_bytes, tpb);
        if ('Err' in encrypted_vetkey) {
            return encrypted_vetkey;
        } else {
            const encrypted_key_bytes = Uint8Array.from(encrypted_vetkey.Ok.inner);
            const derived_public_key_bytes = new TextEncoder().encode("key_manager");
            const derivaition_id = new Uint8Array([...key_owner.toUint8Array(), ...vetkey_name_bytes.inner]);
            const symmetric_key_bytes = 16;
            const symmetric_key_associated_data = new Uint8Array(0);
            const vetkey = tsk.decrypt_and_hash(encrypted_key_bytes, derived_public_key_bytes, derivaition_id, symmetric_key_bytes, symmetric_key_associated_data);
            return { 'Ok': { inner: vetkey } };
        }
    }

    async get_vetkey_verification_key(): Promise<ByteBuf> {
        if (this.verification_key) {
            return this.verification_key;
        } else {
            this.verification_key = await this.actor.get_vetkey_verification_key();
            return this.verification_key;
        }
    }
}

function string_to_bytebuf(s: string): ByteBuf {
    return { inner: new TextEncoder().encode(s) };
}
