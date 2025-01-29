//! Types for V1 encrypted maps. V1 uses one vetkey per map that each authorized
//! user can access. The encryption keys for the map-keys are derived from the
//! vetkey hash.
//!
//! APIs for V1 encrypted maps. V1 uses one vetkey per map that each authorized
//! user can access. The encryption keys for the map-keys are derived from the
//! vetkey hash.

use candid::Principal;
use ic_cdk::api::management_canister::main::CanisterId;
use ic_stable_structures::memory_manager::VirtualMemory;
use ic_stable_structures::storable::{Blob, Bound};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable};
use ic_vetkd_cdk_utils::{AccessRights, ByteBuf, KeyName, MemoryInitializationError, TransportKey};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use std::borrow::Cow;
use std::cell::RefCell;
use std::fmt::Debug;
use std::str::FromStr;

pub mod vetkd_api_types;
use vetkd_api_types::{
    VetKDCurve, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDKeyId, VetKDPublicKeyReply,
    VetKDPublicKeyRequest,
};

const VETKD_SYSTEM_API_CANISTER_ID: &str = "tqzl2-p7777-77776-aaaaa-cai";
const KEY_MANAGER_DERIVATION_PATH: &[u8] = b"key_manager";

// On a high level,
// `ENCRYPTED_MAPS[MapName][MapKey] = EncryptedMapValue`, e.g.
// `ENCRYPTED_MAPS[b"alex's map".into()][b"github API token".into()] = b"secret-api-token-to-be-encrypted".into()`.

pub type VetKeyVerificationKey = ByteBuf;
pub type VetKey = ByteBuf;
pub type Creator = Principal;
pub type Caller = Principal;
pub type KeyId = (Caller, KeyName);

thread_local! {
    static ENCRYPTED_MAPS: RefCell<Option<KeyManager>> = RefCell::new(None);
}

type Memory = VirtualMemory<DefaultMemoryImpl>;

pub struct KeyManager {
    pub access_control: StableBTreeMap<(Caller, KeyId), AccessRights, Memory>,
    pub shared_keys: StableBTreeMap<(KeyId, Caller), (), Memory>,
}

impl KeyManager {
    pub fn try_init(memory_0: Memory, memory_1: Memory) -> Result<(), MemoryInitializationError> {
        if ENCRYPTED_MAPS.with(|cell| cell.borrow().is_some()) {
            return Err(MemoryInitializationError::AlreadyInitialized);
        }

        let access_control = StableBTreeMap::init(memory_0);
        let map_existance = StableBTreeMap::init(memory_1);

        ENCRYPTED_MAPS.with(|cell| {
            *cell.borrow_mut() = Some(KeyManager {
                access_control,
                shared_keys: map_existance,
            });
        });

        Ok(())
    }

    pub fn with_borrow<R, E: Debug>(
        f: impl FnOnce(&KeyManager) -> Result<R, E>,
    ) -> Result<R, String> {
        ENCRYPTED_MAPS.with_borrow(|cell| match cell.as_ref() {
            Some(db) => f(db).map_err(|e| format!("{e:?}")),
            None => Err("memory not initialized".to_string()),
        })
    }

    pub fn with_borrow_mut<R, E: Debug>(
        f: impl FnOnce(&mut KeyManager) -> Result<R, E>,
    ) -> Result<R, String> {
        ENCRYPTED_MAPS.with_borrow_mut(|cell| match cell.as_mut() {
            Some(db) => f(db).map_err(|e| format!("{e:?}")),
            None => Err("memory not initialized".to_string()),
        })
    }
}

pub fn get_accessible_shared_key_ids(caller: Principal) -> Vec<KeyId> {
    KeyManager::with_borrow(|km| {
        Ok::<_, ()>(
            km.access_control
                .range((caller, (Principal::management_canister(), Blob::default()))..)
                .take_while(|((p, _), _)| p == &caller)
                .map(|((_, key_id), _)| key_id)
                .collect(),
        )
    })
    .expect("cannot fail")
}

pub fn get_shared_user_access_for_key(
    caller: Principal,
    key_id: KeyId,
) -> Result<Vec<(Principal, AccessRights)>, String> {
    if get_user_rights(caller, key_id.clone(), caller)?.is_none() {
        return Err("unauthorized user".to_string());
    }

    let users: Vec<Principal> = KeyManager::with_borrow(|km| {
        Ok::<_, ()>(
            km.shared_keys
                .range((key_id.clone(), Principal::management_canister())..)
                .take_while(|((k, _), _)| k == &key_id)
                .map(|((_, user), _)| user)
                .collect(),
        )
    })
    .expect("cannot fail");

    users
        .into_iter()
        .map(|user| {
            get_user_rights(caller, key_id.clone(), user)
                .map(|opt_user_rights| (user, opt_user_rights.expect("always some access rights")))
        })
        .collect::<Result<Vec<_>, _>>()
}

pub async fn get_vetkey_verification_key() -> VetKeyVerificationKey {
    let request = VetKDPublicKeyRequest {
        canister_id: None,
        derivation_path: vec![KEY_MANAGER_DERIVATION_PATH.to_vec()],
        key_id: bls12_381_test_key_1(),
    };

    let (response,): (VetKDPublicKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_public_key",
        (request,),
    )
    .await
    .expect("call to vetkd_public_key failed");

    VetKeyVerificationKey::from(response.public_key)
}

pub async fn get_encrypted_vetkey(
    caller: Principal,
    key_id: KeyId,
    transport_key: TransportKey,
) -> Result<VetKey, String> {
    let user_rights = get_user_rights(caller, key_id.clone(), caller)?;
    if user_rights.is_none() {
        return Err("unauthorized user".to_string());
    }

    let derivation_id = key_id
        .0
        .as_slice()
        .iter()
        .chain(key_id.1.as_ref().iter())
        .cloned()
        .collect();

    let request = VetKDEncryptedKeyRequest {
        derivation_id,
        public_key_derivation_path: vec![KEY_MANAGER_DERIVATION_PATH.to_vec()],
        key_id: bls12_381_test_key_1(),
        encryption_public_key: transport_key.into(),
    };

    let (reply,): (VetKDEncryptedKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_encrypted_key",
        (request,),
    )
    .await
    .expect("call to vetkd_encrypted_key failed");

    Ok(VetKey::from(reply.encrypted_key))
}

pub fn get_user_rights(
    caller: Principal,
    key_id: KeyId,
    user: Principal,
) -> Result<Option<AccessRights>, String> {
    if caller != key_id.0
        && KeyManager::with_borrow(|km| {
            Ok::<_, ()>(km.access_control.get(&(caller, key_id)).is_none())
        })
        .unwrap()
    {
        return Err("unauthorized user".to_string());
    }

    if caller == key_id.0 {
        return Ok(Some(AccessRights::ReadWriteManage));
    }
    KeyManager::with_borrow(|km| Ok::<_, ()>(km.access_control.get(&(user, key_id))))
}

pub fn set_user_rights(
    caller: Principal,
    key_id: KeyId,
    user: Principal,
    access_rights: AccessRights,
) -> Result<Option<AccessRights>, String> {
    if caller == key_id.0 && caller == user {
        return Err("cannot change key owner's user rights".to_string());
    }
    KeyManager::with_borrow_mut(|km| {
        if caller == key_id.0 {
        } else {
            match km.access_control.get(&(caller, key_id.clone())) {
                Some(ar) if ar == AccessRights::ReadWriteManage => {}
                _ => return Err("unauthorized user".to_string()),
            };
        }

        km.shared_keys.insert((key_id.clone(), user), ());

        Ok(km.access_control.insert((user, key_id), access_rights))
    })
}

pub fn remove_user(
    caller: Principal,
    key_id: KeyId,
    user: Principal,
) -> Result<Option<AccessRights>, String> {
    if caller == user && caller == key_id.0 {
        return Err("cannot remove key owner".to_string());
    }

    KeyManager::with_borrow_mut(|km| {
        if caller == key_id.0 {
        } else {
            match km.access_control.get(&(caller, key_id.clone())) {
                Some(ar) if ar == AccessRights::ReadWriteManage => {}
                _ => return Err("unauthorized user".to_string()),
            }
        };

        Ok(km.access_control.remove(&(user, key_id)))
    })
}

pub fn is_key_shared(key_id: KeyId) -> Result<bool, String> {
    KeyManager::with_borrow(|km| {
        Ok::<bool, ()>(
            km.shared_keys
                .range(&(key_id.clone(), Principal::management_canister())..)
                .take_while(|((k, _), _)| k == &key_id)
                .next()
                .is_some(),
        )
    })
}

fn bls12_381_test_key_1() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381,
        name: "insecure_test_key_1".to_string(),
    }
}

fn vetkd_system_api_canister_id() -> CanisterId {
    CanisterId::from_str(VETKD_SYSTEM_API_CANISTER_ID).expect("failed to create canister ID")
}

#[serde_as]
#[derive(Serialize, Deserialize)]
struct StorableDerivationPath {
    #[serde_as(as = "Vec<serde_with::Bytes>")]
    derivation_path: Vec<Vec<u8>>,
}

impl Storable for StorableDerivationPath {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self.derivation_path).expect("failed to serialize"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        let derivation_path =
            serde_cbor::from_slice(bytes.as_ref()).expect("failed to deserialize");
        Self { derivation_path }
    }

    const BOUND: Bound = Bound::Unbounded;
}
