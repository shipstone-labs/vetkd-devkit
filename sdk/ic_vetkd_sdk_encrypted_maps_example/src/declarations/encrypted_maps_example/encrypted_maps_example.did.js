export const idlFactory = ({ IDL }) => {
  const ByteBuf = IDL.Record({ 'inner' : IDL.Vec(IDL.Nat8) });
  const Result = IDL.Variant({ 'Ok' : IDL.Opt(ByteBuf), 'Err' : IDL.Text });
  const Result_1 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Tuple(ByteBuf, ByteBuf)),
    'Err' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'Ok' : ByteBuf, 'Err' : IDL.Text });
  const AccessRights = IDL.Variant({
    'Read' : IDL.Null,
    'ReadWrite' : IDL.Null,
    'ReadWriteManage' : IDL.Null,
  });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Opt(AccessRights),
    'Err' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'Ok' : IDL.Vec(ByteBuf), 'Err' : IDL.Text });
  return IDL.Service({
    'get_accessible_shared_map_names' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, ByteBuf))],
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
    'get_user_rights' : IDL.Func(
        [IDL.Principal, ByteBuf, IDL.Principal],
        [Result_3],
        ['query'],
      ),
    'get_vetkey_verification_key' : IDL.Func([], [ByteBuf], []),
    'insert_encrypted_value' : IDL.Func(
        [IDL.Principal, ByteBuf, ByteBuf, ByteBuf],
        [Result],
        [],
      ),
    'remove_encrypted_value' : IDL.Func(
        [IDL.Principal, ByteBuf, ByteBuf],
        [Result],
        [],
      ),
    'remove_map_values' : IDL.Func([IDL.Principal, ByteBuf], [Result_4], []),
    'remove_user' : IDL.Func(
        [IDL.Principal, ByteBuf, IDL.Principal],
        [Result_3],
        [],
      ),
    'set_user_rights' : IDL.Func(
        [IDL.Principal, ByteBuf, IDL.Principal, AccessRights],
        [Result_3],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
