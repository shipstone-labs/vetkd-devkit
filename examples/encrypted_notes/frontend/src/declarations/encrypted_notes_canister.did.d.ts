import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export interface AccessRights {
  end: [] | [bigint];
  rights: Rights;
  start: [] | [bigint];
}
export interface AuditEntry {
  audit_type: AuditEntryType;
  user: [] | [Principal];
  timestamp: bigint;
  caller: Principal;
  access_rights: [] | [AccessRights];
}
export type AuditEntryType =
  | { AccessSharedVetKey: null }
  | { Share: null }
  | { Unshare: null }
  | { AccessVetKey: null }
  | { Updated: null }
  | { Restored: null }
  | { Created: null }
  | { Deleted: null }
  | { SoftDeleted: null };
export interface ByteBuf {
  inner: Uint8Array | number[];
}
export interface MetadataWrapper {
  number_of_modifications: bigint;
  metadata: Uint8Array | number[];
  tags: Array<string>;
  last_modification_date: bigint;
  last_modified_principal: Principal;
  creation_date: bigint;
}
export type Result =
  | {
      Ok: Array<[ByteBuf, ByteBuf, MetadataWrapper, [] | [Array<AuditEntry>]]>;
    }
  | { Err: string };
export type Result_1 = { Ok: ByteBuf } | { Err: string };
export type Result_2 =
  | { Ok: Array<[Principal, AccessRights]> }
  | { Err: string };
export type Result_3 = { Ok: [] | [AccessRights] } | { Err: string };
export type Result_4 =
  | { Ok: [] | [[ByteBuf, MetadataWrapper]] }
  | { Err: string };
export type Rights =
  | { Read: null }
  | { ReadWrite: null }
  | { ReadWriteManage: null };
export interface _SERVICE {
  get_accessible_shared_map_names: ActorMethod<[], Array<[Principal, ByteBuf]>>;
  get_encrypted_values_for_map_with_metadata: ActorMethod<
    [Principal, ByteBuf],
    Result
  >;
  get_encrypted_vetkey: ActorMethod<[Principal, ByteBuf, ByteBuf], Result_1>;
  get_owned_non_empty_map_names: ActorMethod<[], Array<ByteBuf>>;
  get_shared_user_access_for_map: ActorMethod<[Principal, ByteBuf], Result_2>;
  get_user_rights: ActorMethod<[Principal, ByteBuf, Principal], Result_3>;
  get_vetkey_verification_key: ActorMethod<[], ByteBuf>;
  insert_encrypted_value_with_metadata: ActorMethod<
    [Principal, ByteBuf, ByteBuf, ByteBuf, Array<string>, ByteBuf],
    Result_4
  >;
  remove_encrypted_value_with_metadata: ActorMethod<
    [Principal, ByteBuf, ByteBuf],
    Result_4
  >;
  remove_user: ActorMethod<[Principal, ByteBuf, Principal], Result_3>;
  set_user_rights: ActorMethod<
    [Principal, ByteBuf, Principal, AccessRights],
    Result_3
  >;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
