//! Types for V1 encrypted maps. V1 uses one vetkey per map that each authorized
//! user can access. The encryption keys for the map-keys are derived from the
//! vetkey hash.
//! APIs for V1 encrypted maps. V1 uses one vetkey per map that each authorized
//! user can access. The encryption keys for the map-keys are derived from the
//! vetkey hash.

use candid::Principal;
use ic_stable_structures::memory_manager::VirtualMemory;
use ic_stable_structures::storable::Blob;
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use std::cell::RefCell;
use std::fmt::Debug;

use ic_vetkd_cdk_key_manager::KeyId;
use ic_vetkd_cdk_types::{
    AccessRights, ByteBuf, EncryptedMapValue, MapKey, MemoryInitializationError, TransportKey,
};

// On a high level,
// `ENCRYPTED_MAPS[MapName][MapKey] = EncryptedMapValue`, e.g.
// `ENCRYPTED_MAPS[b"alex's map".into()][b"github API token".into()] = b"secret-api-token-to-be-encrypted".into()`.

pub type VetKeyVerificationKey = ByteBuf;
pub type VetKey = ByteBuf;

thread_local! {
    static ENCRYPTED_MAPS: RefCell<Option<EncryptedMaps>> = const { RefCell::new(None) };
}

type Memory = VirtualMemory<DefaultMemoryImpl>;

pub struct EncryptedMaps {
    pub mapkey_vals: StableBTreeMap<(KeyId, MapKey), EncryptedMapValue, Memory>,
}

impl EncryptedMaps {
    pub fn try_init(
        memory_encrypted_maps: Memory,
        memory_key_manager_0: Memory,
        memory_key_manager_1: Memory,
    ) -> Result<(), MemoryInitializationError> {
        ic_vetkd_cdk_key_manager::KeyManager::try_init(memory_key_manager_0, memory_key_manager_1)?;

        if ENCRYPTED_MAPS.with(|cell| cell.borrow().is_some()) {
            return Err(MemoryInitializationError::AlreadyInitialized);
        }

        let mapkey_vals = StableBTreeMap::init(memory_encrypted_maps);

        ENCRYPTED_MAPS.with(|cell| {
            *cell.borrow_mut() = Some(EncryptedMaps { mapkey_vals });
        });

        Ok(())
    }

    pub fn with_borrow<R, E: Debug>(
        f: impl FnOnce(&EncryptedMaps) -> Result<R, E>,
    ) -> Result<R, String> {
        ENCRYPTED_MAPS.with_borrow(|cell| match cell.as_ref() {
            Some(db) => f(db).map_err(|e| format!("{e:?}")),
            None => Err("memory not initialized".to_string()),
        })
    }

    pub fn with_borrow_mut<R, E: Debug>(
        f: impl FnOnce(&mut EncryptedMaps) -> Result<R, E>,
    ) -> Result<R, String> {
        ENCRYPTED_MAPS.with_borrow_mut(|cell| match cell.as_mut() {
            Some(db) => f(db).map_err(|e| format!("{e:?}")),
            None => Err("memory not initialized".to_string()),
        })
    }
}

pub fn get_accessible_shared_map_names(caller: Principal) -> Vec<KeyId> {
    ic_vetkd_cdk_key_manager::get_accessible_shared_key_ids(caller)
}

pub fn remove_map_values(caller: Principal, key_id: KeyId) -> Result<Vec<MapKey>, String> {
    match ic_vetkd_cdk_key_manager::get_user_rights(caller, key_id, caller)? {
        Some(AccessRights::ReadWrite) | Some(AccessRights::ReadWriteManage) => Ok(()),
        Some(AccessRights::Read) | None => Err("unauthorized user".to_string()),
    }?;

    EncryptedMaps::with_borrow_mut(|em| {
        let keys: Vec<_> = em
            .mapkey_vals
            .range((key_id, Blob::default())..)
            .take_while(|((k, _), _)| k == &key_id)
            .map(|((_name, key), _value)| key)
            .collect();

        for key in keys.iter() {
            em.mapkey_vals.remove(&(key_id, *key));
        }

        Ok::<_, ()>(keys)
    })
}

pub fn get_encrypted_values_for_map(
    caller: Principal,
    key_id: KeyId,
) -> Result<Vec<(MapKey, EncryptedMapValue)>, String> {
    match ic_vetkd_cdk_key_manager::get_user_rights(caller, key_id, caller)? {
        Some(_) => Ok(()),
        None => Err("unauthorized user".to_string()),
    }?;

    EncryptedMaps::with_borrow(|ed| {
        Ok::<_, ()>(
            ed.mapkey_vals
                .range((key_id, Blob::default())..)
                .take_while(|((k, _), _)| k == &key_id)
                .map(|((_, k), v)| (k, v))
                .collect(),
        )
    })
}

pub fn get_encrypted_value(
    caller: Principal,
    key_id: KeyId,
    key: MapKey,
) -> Result<Option<EncryptedMapValue>, String> {
    match ic_vetkd_cdk_key_manager::get_user_rights(caller, key_id, caller)? {
        Some(_) => Ok(()),
        None => Err("unauthorized user".to_string()),
    }?;

    EncryptedMaps::with_borrow(|ed| Ok::<_, ()>(ed.mapkey_vals.get(&(key_id, key))))
}

pub fn insert_encrypted_value(
    caller: Principal,
    key_id: KeyId,
    key: MapKey,
    encrypted_value: EncryptedMapValue,
) -> Result<Option<EncryptedMapValue>, String> {
    match ic_vetkd_cdk_key_manager::get_user_rights(caller, key_id, caller)? {
        Some(AccessRights::ReadWrite) | Some(AccessRights::ReadWriteManage) => Ok(()),
        Some(AccessRights::Read) | None => Err("unauthorized user".to_string()),
    }?;

    EncryptedMaps::with_borrow_mut(|ed| {
        Ok::<_, ()>(ed.mapkey_vals.insert((key_id, key), encrypted_value))
    })
}

pub fn remove_encrypted_value(
    caller: Principal,
    key_id: KeyId,
    key: MapKey,
) -> Result<Option<EncryptedMapValue>, String> {
    match ic_vetkd_cdk_key_manager::get_user_rights(caller, key_id, caller)? {
        Some(AccessRights::ReadWrite) | Some(AccessRights::ReadWriteManage) => Ok(()),
        Some(AccessRights::Read) | None => Err("unauthorized user".to_string()),
    }?;

    EncryptedMaps::with_borrow_mut(|ed| Ok::<_, ()>(ed.mapkey_vals.remove(&(key_id, key))))
}

pub async fn get_vetkey_verification_key() -> VetKeyVerificationKey {
    ic_vetkd_cdk_key_manager::get_vetkey_verification_key().await
}

pub async fn get_encrypted_vetkey(
    caller: Principal,
    key_id: KeyId,
    transport_key: TransportKey,
) -> Result<VetKey, String> {
    ic_vetkd_cdk_key_manager::get_encrypted_vetkey(caller, key_id, transport_key).await
}

pub fn get_user_rights(
    caller: Principal,
    key_id: KeyId,
    user: Principal,
) -> Result<Option<AccessRights>, String> {
    ic_vetkd_cdk_key_manager::get_user_rights(caller, key_id, user)
}

pub fn set_user_rights(
    caller: Principal,
    key_id: KeyId,
    user: Principal,
    access_rights: AccessRights,
) -> Result<Option<AccessRights>, String> {
    ic_vetkd_cdk_key_manager::set_user_rights(caller, key_id, user, access_rights)
}

pub fn remove_user(
    caller: Principal,
    key_id: KeyId,
    user: Principal,
) -> Result<Option<AccessRights>, String> {
    ic_vetkd_cdk_key_manager::remove_user(caller, key_id, user)
}
