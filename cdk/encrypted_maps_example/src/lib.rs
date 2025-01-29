use std::cell::RefCell;

use candid::Principal;
use ic_cdk::{init, query, update};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::storable::Blob;
use ic_stable_structures::DefaultMemoryImpl;
use ic_vetkd_cdk_encrypted_maps::{VetKey, VetKeyVerificationKey};
use ic_vetkd_cdk_utils::{AccessRights, ByteBuf, EncryptedMapValue, TransportKey};

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
}

#[init]
fn init() {
    let m_0: Memory = MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)));
    let m_1: Memory = MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)));
    let m_2: Memory = MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)));
    ic_vetkd_cdk_encrypted_maps::EncryptedMaps::try_init(m_0, m_1, m_2)
        .expect("failed to initialize memory");
}

#[query]
fn get_accessible_shared_map_names() -> Vec<(Principal, ByteBuf)> {
    ic_vetkd_cdk_encrypted_maps::get_accessible_shared_map_names(ic_cdk::caller())
        .into_iter()
        .map(|map_id| (map_id.0, ByteBuf::from(map_id.1.as_ref().to_vec())))
        .collect()
}

#[query]
fn get_encrypted_values_for_map(
    map_owner: Principal,
    map_name: ByteBuf,
) -> Result<Vec<(ByteBuf, EncryptedMapValue)>, String> {
    let map_name = bytebuf_to_blob(map_name)?;
    let map_id = (map_owner, map_name);
    let result =
        ic_vetkd_cdk_encrypted_maps::get_encrypted_values_for_map(ic_cdk::caller(), map_id);
    result.map(|map_values| {
        map_values
            .into_iter()
            .map(|(key, value)| (EncryptedMapValue::from(key.as_slice().to_vec()), value))
            .collect()
    })
}

#[query]
fn get_encrypted_value(
    map_owner: Principal,
    map_name: ByteBuf,
    map_key: ByteBuf,
) -> Result<Option<EncryptedMapValue>, String> {
    let map_name = bytebuf_to_blob(map_name)?;
    let map_id = (map_owner, map_name);
    ic_vetkd_cdk_encrypted_maps::get_encrypted_value(
        ic_cdk::caller(),
        map_id,
        bytebuf_to_blob(map_key)?,
    )
}

#[update]
fn remove_map_values(
    map_owner: Principal,
    map_name: ByteBuf,
) -> Result<Vec<EncryptedMapValue>, String> {
    let map_name = bytebuf_to_blob(map_name)?;
    let map_id = (map_owner, map_name);
    let result = ic_vetkd_cdk_encrypted_maps::remove_map_values(ic_cdk::caller(), map_id);
    result.map(|removed| {
        removed
            .into_iter()
            .map(|key| ByteBuf::from(key.as_ref().to_vec()))
            .collect()
    })
}

#[update]
fn insert_encrypted_value(
    map_owner: Principal,
    map_name: ByteBuf,
    map_key: ByteBuf,
    value: EncryptedMapValue,
) -> Result<Option<EncryptedMapValue>, String> {
    let map_name = bytebuf_to_blob(map_name)?;
    let map_id = (map_owner, map_name);
    ic_vetkd_cdk_encrypted_maps::insert_encrypted_value(
        ic_cdk::caller(),
        map_id,
        bytebuf_to_blob(map_key)?,
        value,
    )
}

#[update]
fn remove_encrypted_value(
    map_owner: Principal,
    map_name: ByteBuf,
    map_key: ByteBuf,
) -> Result<Option<EncryptedMapValue>, String> {
    let map_name = bytebuf_to_blob(map_name)?;
    let map_id = (map_owner, map_name);
    ic_vetkd_cdk_encrypted_maps::remove_encrypted_value(
        ic_cdk::caller(),
        map_id,
        bytebuf_to_blob(map_key)?,
    )
}

#[update]
async fn get_vetkey_verification_key() -> VetKeyVerificationKey {
    ic_vetkd_cdk_encrypted_maps::get_vetkey_verification_key().await
}

#[update]
async fn get_encrypted_vetkey(
    map_owner: Principal,
    map_name: ByteBuf,
    transport_key: TransportKey,
) -> Result<VetKey, String> {
    let map_name = bytebuf_to_blob(map_name)?;
    let map_id = (map_owner, map_name);
    ic_vetkd_cdk_encrypted_maps::get_encrypted_vetkey(ic_cdk::caller(), map_id, transport_key).await
}

#[query]
fn get_user_rights(
    map_owner: Principal,
    map_name: ByteBuf,
) -> Result<Option<AccessRights>, String> {
    let map_name = bytebuf_to_blob(map_name)?;
    let map_id = (map_owner, map_name);
    ic_vetkd_cdk_encrypted_maps::get_user_rights(ic_cdk::caller(), map_id, ic_cdk::caller())
}

#[update]
fn set_user_rights(
    map_owner: Principal,
    map_name: ByteBuf,
    user: Principal,
    access_rights: AccessRights,
) -> Result<Option<AccessRights>, String> {
    let map_name = bytebuf_to_blob(map_name)?;
    let map_id = (map_owner, map_name);
    ic_vetkd_cdk_encrypted_maps::set_user_rights(ic_cdk::caller(), map_id, user, access_rights)
}

#[update]
fn remove_user(
    map_owner: Principal,
    map_name: ByteBuf,
    user: Principal,
) -> Result<Option<AccessRights>, String> {
    let map_name = bytebuf_to_blob(map_name)?;
    let map_id = (map_owner, map_name);
    ic_vetkd_cdk_encrypted_maps::remove_user(ic_cdk::caller(), map_id, user)
}

fn bytebuf_to_blob(buf: ByteBuf) -> Result<Blob<32>, String> {
    Blob::try_from(buf.as_ref()).map_err(|_| "too large input".to_string())
}

ic_cdk::export_candid!();
