import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AccessRights = { 'Read' : null } |
  { 'ReadWrite' : null } |
  { 'ReadWriteManage' : null };
export interface ByteBuf { 'inner' : Uint8Array | number[] }
export type Result = { 'Ok' : [] | [ByteBuf] } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : Array<[ByteBuf, ByteBuf]> } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : ByteBuf } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : [] | [AccessRights] } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : Array<ByteBuf> } |
  { 'Err' : string };
export interface _SERVICE {
  'get_accessible_shared_map_names' : ActorMethod<
    [],
    Array<[Principal, ByteBuf]>
  >,
  'get_encrypted_value' : ActorMethod<[Principal, ByteBuf, ByteBuf], Result>,
  'get_encrypted_values_for_map' : ActorMethod<[Principal, ByteBuf], Result_1>,
  'get_encrypted_vetkey' : ActorMethod<[Principal, ByteBuf, ByteBuf], Result_2>,
  'get_user_rights' : ActorMethod<[Principal, ByteBuf, Principal], Result_3>,
  'get_vetkey_verification_key' : ActorMethod<[], ByteBuf>,
  'insert_encrypted_value' : ActorMethod<
    [Principal, ByteBuf, ByteBuf, ByteBuf],
    Result
  >,
  'remove_encrypted_value' : ActorMethod<[Principal, ByteBuf, ByteBuf], Result>,
  'remove_map_values' : ActorMethod<[Principal, ByteBuf], Result_4>,
  'remove_user' : ActorMethod<[Principal, ByteBuf, Principal], Result_3>,
  'set_user_rights' : ActorMethod<
    [Principal, ByteBuf, Principal, AccessRights],
    Result_3
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
