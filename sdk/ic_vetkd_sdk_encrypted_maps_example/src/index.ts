import { Principal } from "@dfinity/principal";
import { ActorSubclass, HttpAgent } from "@dfinity/agent";
import { createActor, encrypted_maps_example } from "./declarations/encrypted_maps_example/index";
import { _SERVICE as _DEFAULT_ENCRYPTED_MAPS_SERVICE, AccessRights, ByteBuf } from "./declarations/encrypted_maps_example/encrypted_maps_example.did";
import { EncryptedMapsClient } from "ic_vetkd_sdk_encrypted_maps/src/index";

export class DefaultEncryptedMapsClient implements EncryptedMapsClient {
    canisterId: string;
    actor: ActorSubclass<_DEFAULT_ENCRYPTED_MAPS_SERVICE>;

    constructor(agent: HttpAgent, canisterId: string) {
        this.canisterId = canisterId;
        this.actor = createActor(canisterId, { agent: agent });
    }

    get_accessible_shared_map_names(): Promise<[Principal, ByteBuf][]> {
        return this.actor.get_accessible_shared_map_names();
    }

    async get_encrypted_value(map_owner: Principal, map_name: string, map_key: string): Promise<{ 'Ok': [] | [ByteBuf] } |
    { 'Err': string }> {
        const encrypted_bytes = await this.actor.get_encrypted_value(map_owner, string_to_bytebuf(map_name), string_to_bytebuf(map_key));

        const decrypted_bytes = decrypt(encrypted_bytes);
        return { 'Ok': decrypted_bytes };
    }

    get_encrypted_values_for_map(map_owner: Principal, map_name: string): Promise<{ 'Ok': Array<[ByteBuf, ByteBuf]> } |
    { 'Err': string }> {
        return this.actor.get_encrypted_values_for_map(map_owner, string_to_bytebuf(map_name));
    }

    get_encryped_vetkey(map_owner: Principal, map_name: string): Promise<{ 'Ok': ByteBuf } |
    { 'Err': string }> {
        let dummy_key = { inner: new Uint8Array(0) };
        return this.actor.get_encrypted_vetkey(map_owner, string_to_bytebuf(map_name), dummy_key);
    }

    insert_encrypted_value(map_owner: Principal, map_name: string, map_key: string, data: ByteBuf): Promise<{ 'Ok': [] | [ByteBuf] } |
    { 'Err': string }> {
        return this.actor.insert_encrypted_value(map_owner, string_to_bytebuf(map_name), string_to_bytebuf(map_key), data);
    }

    remove_encrypted_value(map_owner: Principal, map_name: string, map_key: string): Promise<{ 'Ok': [] | [ByteBuf] } |
    { 'Err': string }> {
        return this.actor.remove_encrypted_value(map_owner, string_to_bytebuf(map_name), string_to_bytebuf(map_key));
    }

    remove_map_values(map_owner: Principal, map_name: string): Promise<{ 'Ok': Array<ByteBuf> } |
    { 'Err': string }> {
        return this.actor.remove_map_values(map_owner, string_to_bytebuf(map_name));
    }

    get_vetkey_verification_key(): Promise<ByteBuf> {
        return this.actor.get_vetkey_verification_key();
    }

    set_user_rights(owner: Principal, map_name: string, user: Principal, user_rights: AccessRights): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }> {
        return this.actor.set_user_rights(owner, string_to_bytebuf(map_name), user, user_rights);
    }

    get_user_rights(owner: Principal, map_name: string, user: Principal): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }> {
        return this.actor.get_user_rights(owner, string_to_bytebuf(map_name), user);
    }
}

async function encrypt(data: Uint8Array, map_root_crypto_key: CryptoKey, map_key: string): Promise<Uint8Array> {
    // The iv must never be reused with a given key.
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        map_root_crypto_key,
        data
    );

    return new Uint8Array([...new Uint8Array(iv), ...new Uint8Array(ciphertext)]);
}

function decrypt(encrypted_bytes: Uint8Array, decryption_vetkey: CryptoKey, map_key: string): Uint8Array {
    const note_key: CryptoKey = await get([note_id.toString(), owner]);

    const data_encoded = Uint8Array.from([...data].map(ch => ch.charCodeAt(0))).buffer
    // The iv must never be reused with a given key.
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        note_key,
        data_encoded
    );

    const iv_decoded = String.fromCharCode(...new Uint8Array(iv));
    const cipher_decoded = String.fromCharCode(...new Uint8Array(ciphertext));
    //return iv_decoded + cipher_decoded;
    return new Uint8Array(0);
}

// async fetch_note_key_if_needed(note_id: bigint, owner: string) {
//     if (!await get([note_id.toString(), owner])) {
//         const seed = window.crypto.getRandomValues(new Uint8Array(32));
//         const tsk = new vetkd.TransportSecretKey(seed);

//         const ek_bytes_hex = await this.actor.encrypted_symmetric_key_for_note(note_id, tsk.public_key());
//         const pk_bytes_hex = await this.actor.symmetric_key_verification_key_for_note();

//         const note_id_bytes: Uint8Array = bigintTo128BitBigEndianUint8Array(note_id);
//         const owner_utf8: Uint8Array = new TextEncoder().encode(owner);
//         let derivation_id = new Uint8Array(note_id_bytes.length + owner_utf8.length);
//         derivation_id.set(note_id_bytes);
//         derivation_id.set(owner_utf8, note_id_bytes.length);

//         const aes_256_gcm_key_raw = tsk.decrypt_and_hash(
//             hex_decode(ek_bytes_hex),
//             hex_decode(pk_bytes_hex),
//             derivation_id,
//             32,
//             new TextEncoder().encode("aes-256-gcm")
//         );
//         const note_key: CryptoKey = await window.crypto.subtle.importKey("raw", aes_256_gcm_key_raw, "AES-GCM", false, ["encrypt", "decrypt"]);
//         await set([note_id.toString(), owner], note_key)
//     }
// }

function string_to_bytebuf(s: string): ByteBuf {
    return { inner: new TextEncoder().encode(s) };
}
