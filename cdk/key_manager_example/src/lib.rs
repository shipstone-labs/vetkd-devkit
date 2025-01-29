use std::cell::RefCell;

use candid::Principal;
use ic_cdk::{init, query, update};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::storable::Blob;
use ic_stable_structures::DefaultMemoryImpl;
use ic_vetkd_cdk_key_manager::{self, VetKey, VetKeyVerificationKey};
use ic_vetkd_cdk_utils::{AccessRights, ByteBuf, TransportKey};

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
}

#[init]
fn init() {
    let m_0: Memory = MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)));
    let m_1: Memory = MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)));
    ic_vetkd_cdk_key_manager::KeyManager::try_init(m_0, m_1).expect("failed to initialize memory");
}

#[query]
fn get_accessible_shared_key_ids() -> Vec<(Principal, ByteBuf)> {
    ic_vetkd_cdk_key_manager::get_accessible_shared_key_ids(ic_cdk::caller())
        .into_iter()
        .map(|key_id| (key_id.0, ByteBuf::from(key_id.1.as_ref().to_vec())))
        .collect()
}

#[query]
fn get_shared_user_access_for_key(
    key_owner: Principal,
    key_name: ByteBuf,
) -> Result<Vec<(Principal, AccessRights)>, String> {
    let key_name = bytebuf_to_blob(key_name)?;
    let key_id = (key_owner, key_name);
    ic_vetkd_cdk_key_manager::get_shared_user_access_for_key(ic_cdk::caller(), key_id)
}

#[update]
async fn get_vetkey_verification_key() -> VetKeyVerificationKey {
    ic_vetkd_cdk_key_manager::get_vetkey_verification_key().await
}

#[update]
async fn get_encrypted_vetkey(
    key_owner: Principal,
    key_name: ByteBuf,
    transport_key: TransportKey,
) -> Result<VetKey, String> {
    let key_name = bytebuf_to_blob(key_name)?;
    let key_id = (key_owner, key_name);
    ic_vetkd_cdk_key_manager::get_encrypted_vetkey(ic_cdk::caller(), key_id, transport_key).await
}

#[query]
fn get_user_rights(
    key_owner: Principal,
    key_name: ByteBuf,
) -> Result<Option<AccessRights>, String> {
    let key_name = bytebuf_to_blob(key_name)?;
    let key_id = (key_owner, key_name);
    ic_vetkd_cdk_key_manager::get_user_rights(ic_cdk::caller(), key_id, ic_cdk::caller())
}

#[update]
fn set_user_rights(
    key_owner: Principal,
    key_name: ByteBuf,
    user: Principal,
    access_rights: AccessRights,
) -> Result<Option<AccessRights>, String> {
    let key_name = bytebuf_to_blob(key_name)?;
    let key_id = (key_owner, key_name);
    ic_vetkd_cdk_key_manager::set_user_rights(ic_cdk::caller(), key_id, user, access_rights)
}

#[update]
fn remove_user(
    key_owner: Principal,
    key_name: ByteBuf,
    user: Principal,
) -> Result<Option<AccessRights>, String> {
    let key_name = bytebuf_to_blob(key_name)?;
    let key_id = (key_owner, key_name);
    ic_vetkd_cdk_key_manager::remove_user(ic_cdk::caller(), key_id, user)
}

fn bytebuf_to_blob(buf: ByteBuf) -> Result<Blob<32>, String> {
    Blob::try_from(buf.as_ref()).map_err(|_| "too large input".to_string())
}

ic_cdk::export_candid!();
