import { Principal } from "@dfinity/principal";

export class EncryptedMaps {
    canister_client: EncryptedMapsClient;
    constructor(canister_client: EncryptedMapsClient) { this.canister_client = canister_client; }

    async get_accessible_shared_map_names(): Promise<[Principal, ByteBuf][]> {
        return await this.canister_client.get_accessible_shared_map_names();
    }

    async get_encrypted_value(map_owner: Principal, map_name: string, map_key: string): Promise<{ 'Ok': [] | [ByteBuf] } |
    { 'Err': string }> {
        return await this.canister_client.get_encrypted_value(map_owner, map_name, map_key);
    }

    async get_encrypted_values_for_map(map_owner: Principal, map_name: string): Promise<{ 'Ok': Array<[ByteBuf, ByteBuf]> } |
    { 'Err': string }> {
        return await this.canister_client.get_encrypted_values_for_map(map_owner, map_name);
    }

    async get_encrypted_vetkey(map_owner: Principal, map_name: string): Promise<{ 'Ok': ByteBuf } |
    { 'Err': string }> {
        return await this.canister_client.get_encryped_vetkey(map_owner, map_name);
    }

    async insert_encrypted_value(map_owner: Principal, map_name: string, map_key: string, data: ByteBuf): Promise<{ 'Ok': [] | [ByteBuf] } |
    { 'Err': string }> {
        return await this.canister_client.insert_encrypted_value(map_owner, map_name, map_key, data);
    }

    async remove_encrypted_value(map_owner: Principal, map_name: string, map_key: string): Promise<{ 'Ok': [] | [ByteBuf] } |
    { 'Err': string }> {
        return await this.canister_client.remove_encrypted_value(map_owner, map_name, map_key);
    }

    async remove_map_values(map_owner: Principal, map_name: string): Promise<{ 'Ok': Array<ByteBuf> } |
    { 'Err': string }> {
        return await this.canister_client.remove_map_values(map_owner, map_name);
    }

    async get_vetkey_verification_key(): Promise<ByteBuf> {
        return await this.canister_client.get_vetkey_verification_key();
    }

    async set_user_rights(owner: Principal, map_name: string, user: Principal, user_rights: AccessRights): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }> {
        return await this.canister_client.set_user_rights(owner, map_name, user, user_rights);
    }

    async get_user_rights(owner: Principal, map_name: string, user: Principal): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }> {
        return await this.canister_client.get_user_rights(owner, map_name, user);
    }
}

export interface EncryptedMapsClient {
    get_accessible_shared_map_names(): Promise<[Principal, ByteBuf][]>;
    get_encrypted_value(map_owner: Principal, map_name: string, map_key: string): Promise<{ 'Ok': [] | [ByteBuf] } |
    { 'Err': string }>;
    get_encrypted_values_for_map(map_owner: Principal, map_name: string): Promise<{ 'Ok': Array<[ByteBuf, ByteBuf]> } |
    { 'Err': string }>;
    insert_encrypted_value(map_owner: Principal, map_name: string, map_key: string, data: ByteBuf): Promise<{ 'Ok': [] | [ByteBuf] } |
    { 'Err': string }>;
    remove_encrypted_value(map_owner: Principal, map_name: string, map_key: string): Promise<{ 'Ok': [] | [ByteBuf] } |
    { 'Err': string }>;
    remove_map_values(map_owner: Principal, map_name: string): Promise<{ 'Ok': Array<ByteBuf> } |
    { 'Err': string }>;
    set_user_rights(owner: Principal, map_name: string, user: Principal, user_rights: AccessRights): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }>;
    get_user_rights(owner: Principal, map_name: string, user: Principal): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }>;
    get_encryped_vetkey(map_owner: Principal, map_name: string): Promise<{ 'Ok': ByteBuf } |
    { 'Err': string }>;
    get_vetkey_verification_key(): Promise<ByteBuf>;
}

export type AccessRights = { 'Read': null } |
{ 'ReadWrite': null } |
{ 'ReadWriteManage': null };
export interface ByteBuf { 'inner': Uint8Array | number[] }
