import { Principal } from "@dfinity/principal";

export class KeyManager {
    canister_client: KeyManagerClient;
    constructor(canister_client: KeyManagerClient) { this.canister_client = canister_client; }

    async get_accessible_shared_key_ids(): Promise<[Principal, ByteBuf][]> {
        return await this.canister_client.get_accessible_shared_key_ids();
    }

    async get_encrypted_vetkey(key_owner: Principal, vetkey_name: string): Promise<{ 'Ok': ByteBuf } |
    { 'Err': string }> {
        return await this.canister_client.get_encryped_vetkey(key_owner, vetkey_name);
    }

    async get_vetkey_verification_key(): Promise<ByteBuf> {
        return await this.canister_client.get_vetkey_verification_key();
    }

    async set_user_rights(owner: Principal, vetkey_name: string, user: Principal, user_rights: AccessRights): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }> {
        return await this.canister_client.set_user_rights(owner, vetkey_name, user, user_rights);
    }

    async get_user_rights(owner: Principal, vetkey_name: string, user: Principal): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }> {
        return await this.canister_client.get_user_rights(owner, vetkey_name, user);
    }
}

export interface KeyManagerClient {
    get_accessible_shared_key_ids(): Promise<[Principal, ByteBuf][]>;
    set_user_rights(owner: Principal, vetkey_name: string, user: Principal, user_rights: AccessRights): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }>;
    get_user_rights(owner: Principal, vetkey_name: string, user: Principal): Promise<{ 'Ok': [] | [AccessRights] } |
    { 'Err': string }>;
    get_encryped_vetkey(key_owner: Principal, vetkey_name: string): Promise<{ 'Ok': ByteBuf } |
    { 'Err': string }>;
    get_vetkey_verification_key(): Promise<ByteBuf>;
}

export type AccessRights = { 'Read' : null } |
  { 'ReadWrite' : null } |
  { 'ReadWriteManage' : null };
export interface ByteBuf { 'inner' : Uint8Array | number[] }
