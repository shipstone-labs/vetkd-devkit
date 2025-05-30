import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AccessRights {
  'end' : [] | [bigint],
  'rights' : Rights,
  'start' : [] | [bigint],
}
export interface ByteBuf { 'inner' : Uint8Array | number[] }
export interface EncryptedMapData {
  'access_control' : Array<[Principal, AccessRights]>,
  'keyvals' : Array<[ByteBuf, ByteBuf]>,
  'map_name' : ByteBuf,
  'map_owner' : Principal,
}
export type Result = { 'Ok' : [] | [ByteBuf] } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : Array<[ByteBuf, ByteBuf]> } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : ByteBuf } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : Array<[Principal, AccessRights]> } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : Array<[ByteBuf, TombstoneEntry]> } |
  { 'Err' : string };
export type Result_5 = { 'Ok' : [] | [AccessRights] } |
  { 'Err' : string };
export type Result_6 = { 'Ok' : Array<ByteBuf> } |
  { 'Err' : string };
export type Result_7 = { 'Ok' : [] | [TombstoneEntry] } |
  { 'Err' : string };
export type Rights = { 'Read' : null } |
  { 'ReadWrite' : null } |
  { 'ReadWriteManage' : null };
export interface TombstoneEntry {
  'value' : ByteBuf,
  'deletion_timestamp' : bigint,
  'deleted_by' : Principal,
  'marked_for_purge' : boolean,
}
export interface _SERVICE {
  'get_accessible_shared_map_names' : ActorMethod<
    [],
    Array<[Principal, ByteBuf]>
  >,
  'get_all_accessible_encrypted_maps' : ActorMethod<
    [],
    Array<EncryptedMapData>
  >,
  'get_all_accessible_encrypted_values' : ActorMethod<
    [],
    Array<[[Principal, ByteBuf], Array<[ByteBuf, ByteBuf]>]>
  >,
  'get_encrypted_value' : ActorMethod<[Principal, ByteBuf, ByteBuf], Result>,
  'get_encrypted_values_for_map' : ActorMethod<[Principal, ByteBuf], Result_1>,
  'get_encrypted_vetkey' : ActorMethod<[Principal, ByteBuf, ByteBuf], Result_2>,
  'get_owned_non_empty_map_names' : ActorMethod<[], Array<ByteBuf>>,
  'get_shared_user_access_for_map' : ActorMethod<
    [Principal, ByteBuf],
    Result_3
  >,
  'get_tombstones' : ActorMethod<[Principal, ByteBuf], Result_4>,
  'get_user_rights' : ActorMethod<[Principal, ByteBuf, Principal], Result_5>,
  'get_vetkey_verification_key' : ActorMethod<[], ByteBuf>,
  'hard_delete_encrypted_value' : ActorMethod<
    [Principal, ByteBuf, ByteBuf],
    Result
  >,
  'hard_delete_map_values' : ActorMethod<[Principal, ByteBuf], Result_6>,
  'insert_encrypted_value' : ActorMethod<
    [Principal, ByteBuf, ByteBuf, ByteBuf],
    Result
  >,
  'purge_tombstone' : ActorMethod<[Principal, ByteBuf, ByteBuf], Result_7>,
  'remove_encrypted_value' : ActorMethod<[Principal, ByteBuf, ByteBuf], Result>,
  'remove_map_values' : ActorMethod<[Principal, ByteBuf], Result_6>,
  'remove_user' : ActorMethod<[Principal, ByteBuf, Principal], Result_5>,
  'restore_value' : ActorMethod<[Principal, ByteBuf, ByteBuf], Result>,
  'set_user_rights' : ActorMethod<
    [Principal, ByteBuf, Principal, AccessRights],
    Result_5
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
