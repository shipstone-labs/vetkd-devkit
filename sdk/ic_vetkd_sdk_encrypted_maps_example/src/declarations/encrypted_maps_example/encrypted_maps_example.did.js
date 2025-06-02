export const idlFactory = ({ IDL }) => {
  const ByteBuf = IDL.Record({ 'inner' : IDL.Vec(IDL.Nat8) });
  const Rights = IDL.Variant({
    'Read' : IDL.Null,
    'ReadWrite' : IDL.Null,
    'ReadWriteManage' : IDL.Null,
  });
  const AccessRights = IDL.Record({
    'end' : IDL.Opt(IDL.Nat64),
    'rights' : Rights,
    'start' : IDL.Opt(IDL.Nat64),
  });
  const EncryptedMapData = IDL.Record({
    'access_control' : IDL.Vec(IDL.Tuple(IDL.Principal, AccessRights)),
    'keyvals' : IDL.Vec(IDL.Tuple(ByteBuf, ByteBuf)),
    'map_name' : ByteBuf,
    'map_owner' : IDL.Principal,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Opt(ByteBuf), 'Err' : IDL.Text });
  const Result_1 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Tuple(ByteBuf, ByteBuf)),
    'Err' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'Ok' : ByteBuf, 'Err' : IDL.Text });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Tuple(IDL.Principal, AccessRights)),
    'Err' : IDL.Text,
  });
  const TombstoneEntry = IDL.Record({
    'value' : ByteBuf,
    'deletion_timestamp' : IDL.Nat64,
    'deleted_by' : IDL.Principal,
    'marked_for_purge' : IDL.Bool,
  });
  const Result_4 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Tuple(ByteBuf, TombstoneEntry)),
    'Err' : IDL.Text,
  });
  const Result_5 = IDL.Variant({
    'Ok' : IDL.Opt(AccessRights),
    'Err' : IDL.Text,
  });
  const Result_6 = IDL.Variant({ 'Ok' : IDL.Vec(ByteBuf), 'Err' : IDL.Text });
  const Result_7 = IDL.Variant({
    'Ok' : IDL.Opt(TombstoneEntry),
    'Err' : IDL.Text,
  });
  return IDL.Service({
    'get_accessible_shared_map_names' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, ByteBuf))],
        ['query'],
      ),
    'get_all_accessible_encrypted_maps' : IDL.Func(
        [],
        [IDL.Vec(EncryptedMapData)],
        ['query'],
      ),
    'get_all_accessible_encrypted_values' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              IDL.Tuple(IDL.Principal, ByteBuf),
              IDL.Vec(IDL.Tuple(ByteBuf, ByteBuf)),
            )
          ),
        ],
        ['query'],
      ),
    'get_encrypted_value' : IDL.Func(
        [IDL.Principal, ByteBuf, ByteBuf],
        [Result],
        ['query'],
      ),
    'get_encrypted_values_for_map' : IDL.Func(
        [IDL.Principal, ByteBuf],
        [Result_1],
        ['query'],
      ),
    'get_encrypted_vetkey' : IDL.Func(
        [IDL.Principal, ByteBuf, ByteBuf],
        [Result_2],
        [],
      ),
    'get_owned_non_empty_map_names' : IDL.Func(
        [],
        [IDL.Vec(ByteBuf)],
        ['query'],
      ),
    'get_shared_user_access_for_map' : IDL.Func(
        [IDL.Principal, ByteBuf],
        [Result_3],
        ['query'],
      ),
    'get_tombstones' : IDL.Func(
        [IDL.Principal, ByteBuf],
        [Result_4],
        ['query'],
      ),
    'get_user_rights' : IDL.Func(
        [IDL.Principal, ByteBuf, IDL.Principal],
        [Result_5],
        ['query'],
      ),
    'get_vetkey_verification_key' : IDL.Func([], [ByteBuf], []),
    'hard_delete_encrypted_value' : IDL.Func(
        [IDL.Principal, ByteBuf, ByteBuf],
        [Result],
        [],
      ),
    'hard_delete_map_values' : IDL.Func(
        [IDL.Principal, ByteBuf],
        [Result_6],
        [],
      ),
    'insert_encrypted_value' : IDL.Func(
        [IDL.Principal, ByteBuf, ByteBuf, ByteBuf],
        [Result],
        [],
      ),
    'purge_tombstone' : IDL.Func(
        [IDL.Principal, ByteBuf, ByteBuf],
        [Result_7],
        [],
      ),
    'remove_encrypted_value' : IDL.Func(
        [IDL.Principal, ByteBuf, ByteBuf],
        [Result],
        [],
      ),
    'remove_map_values' : IDL.Func([IDL.Principal, ByteBuf], [Result_6], []),
    'remove_user' : IDL.Func(
        [IDL.Principal, ByteBuf, IDL.Principal],
        [Result_5],
        [],
      ),
    'restore_value' : IDL.Func([IDL.Principal, ByteBuf, ByteBuf], [Result], []),
    'set_user_rights' : IDL.Func(
        [IDL.Principal, ByteBuf, IDL.Principal, AccessRights],
        [Result_5],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
