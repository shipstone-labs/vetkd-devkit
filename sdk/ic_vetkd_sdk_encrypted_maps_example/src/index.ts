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

    get_encrypted_value(map_owner: Principal, map_name: string, map_key: string): Promise<{ 'Ok': [] | [ByteBuf] } |
    { 'Err': string }> {
        return this.actor.get_encrypted_value(map_owner, string_to_bytebuf(map_name), string_to_bytebuf(map_key));
    }

    get_encrypted_values_for_map(map_owner: Principal, map_name: string): Promise<{ 'Ok': Array<[ByteBuf, ByteBuf]> } |
    { 'Err': string }> {
        return this.actor.get_encrypted_values_for_map(map_owner, string_to_bytebuf(map_name));
    }

    get_encrypted_vetkey(map_owner: Principal, map_name: string, transport_key: Uint8Array): Promise<{ 'Ok': ByteBuf } |
    { 'Err': string }> {
        return this.actor.get_encrypted_vetkey(map_owner, string_to_bytebuf(map_name), { inner: transport_key });
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

function string_to_bytebuf(s: string): ByteBuf {
    return { inner: new TextEncoder().encode(s) };
}
