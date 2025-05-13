//! # `VetKD` CDK - `KeyManager`
//!
//! ## Overview
//!
//! The **`KeyManager`** is a support library for **vetKeys**, an Internet Computer (ICP) feature
//! that enables the derivation of **encrypted cryptographic keys**. This library simplifies
//! the process of key retrieval, encryption, and controlled sharing, ensuring secure and
//! efficient key management for canisters and users.
//!
//! ## Core Features
//!
//! - **Request an Encrypted Key:** Users can derive any number of **encrypted cryptographic keys**,
//!   secured using a **transport key**. Each key is associated with a unique **key id**.
//! - **Manage Key Sharing:** A user can **share their keys** with other users while controlling access rights.
//! - **Access Control Management:** Users can define and enforce **fine-grained permissions**
//!   (read, write, manage) for each key.
//! - **Uses Stable Storage:** The library persists key access information using **`StableBTreeMap`**,
//!   ensuring reliability across canister upgrades.
//!
//! ## `KeyManager` Architecture
//!
//! The **`KeyManager`** consists of two primary components:
//!
//! 1. **Access Control Map** (`access_control`): Maps `(Caller, KeyId)` to `AccessRights`, defining permissions for each user.
//! 2. **Shared Keys Map** (`shared_keys`): Tracks which users have access to shared keys.

use candid::Principal;
use ic_cdk::api::management_canister::main::CanisterId;
use ic_stable_structures::memory_manager::VirtualMemory;
use ic_stable_structures::storable::Blob;
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell, Storable};
use ic_vetkd_cdk_types::{
    now, AccessRights, AuditEntry, AuditLog, ByteBuf, KeyName, Rights, TransportKey,
};
use std::future::Future;
use std::str::FromStr;

#[cfg(feature = "expose-testing-api")]
use std::cell::RefCell;

pub mod vetkd_api_types;
use vetkd_api_types::{
    VetKDCurve, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDKeyId, VetKDPublicKeyReply,
    VetKDPublicKeyRequest,
};

const VETKD_SYSTEM_API_CANISTER_ID: &str = "aaaaa-aa";

// On a high level,
// `ENCRYPTED_MAPS[MapName][MapKey] = EncryptedMapValue`, e.g.
// `ENCRYPTED_MAPS[b"alex's map".into()][b"github API token".into()] = b"secret-api-token-to-be-encrypted".into()`.

pub type VetKeyVerificationKey = ByteBuf;
pub type VetKey = ByteBuf;
pub type Creator = Principal;
pub type Caller = Principal;
pub type KeyId = (Caller, KeyName);

#[cfg(feature = "expose-testing-api")]
thread_local! {
    static VETKD_TESTING_CANISTER_ID: RefCell<Option<Principal>> = const { RefCell::new(None) };
}

type Memory = VirtualMemory<DefaultMemoryImpl>;

pub struct KeyManager {
    pub domain_separator: StableCell<String, Memory>,
    pub access_control: StableBTreeMap<(Caller, KeyId), AccessRights, Memory>,
    pub shared_keys: StableBTreeMap<(KeyId, Caller), (), Memory>,
    pub audit_logs: Option<StableBTreeMap<KeyId, AuditLog, Memory>>,
}

impl KeyManager {
    /// Initializes the `KeyManager` with stable storage.
    /// This function must be called exactly once before any other `KeyManager` operation can be invoked.
    ///
    /// # Panics
    ///
    /// Panics if the domain separator cannot be initialized in stable storage.
    #[must_use]
    pub fn init(
        domain_separator: &str,
        memory_domain_separator: Memory,
        memory_access_control: Memory,
        memory_shared_keys: Memory,
        memory_audit_log: Option<Memory>,
    ) -> Self {
        let domain_separator =
            StableCell::init(memory_domain_separator, domain_separator.to_string())
                .expect("failed to initialize domain separator");
        let audit_logs = memory_audit_log.map(StableBTreeMap::init);
        Self {
            domain_separator,
            access_control: StableBTreeMap::init(memory_access_control),
            shared_keys: StableBTreeMap::init(memory_shared_keys),
            audit_logs,
        }
    }

    /// Retrieves all key IDs shared with the given caller.
    ///
    /// Returns a list of key IDs that the caller has access to.
    #[must_use]
    pub fn get_accessible_shared_key_ids(&self, caller: Principal) -> Vec<KeyId> {
        self.access_control
            .range((caller, (Principal::management_canister(), Blob::default()))..)
            .take_while(|((p, _), _)| p == &caller)
            .map(|((_, key_id), _)| key_id)
            .collect()
    }

    /// Retrieves a list of users with whom a given key has been shared, along with their access rights.
    ///
    /// # Errors
    ///
    /// Returns an error if the caller doesn't have read permission for the key.
    ///
    /// # Panics
    ///
    /// Panics if a user without access rights is found in the shared keys list (should never happen).
    pub fn get_shared_user_access_for_key(
        &self,
        caller: Principal,
        key_id: KeyId,
    ) -> Result<Vec<(Principal, AccessRights)>, String> {
        self.ensure_user_can_read(caller, key_id)?;

        self.shared_keys
            .range((key_id, Principal::management_canister())..)
            .take_while(|((k, _), ())| k == &key_id)
            .map(|((_, user), ())| user)
            .map(|user| {
                self.get_user_rights(caller, key_id, user)
                    .map(|opt_user_rights| {
                        (user, opt_user_rights.expect("always some access rights"))
                    })
            })
            .collect::<Result<Vec<_>, _>>()
    }

    /// Retrieves the VET key verification key from the system API.
    ///
    /// Returns a future that resolves to the verification key.
    ///
    /// # Panics
    ///
    /// Panics if the call to the `vetkd_public_key` API fails.
    pub fn get_vetkey_verification_key(
        &self,
    ) -> impl Future<Output = VetKeyVerificationKey> + Send + Sync {
        use futures::future::FutureExt;

        let request = VetKDPublicKeyRequest {
            canister_id: None,
            derivation_path: vec![self.domain_separator.get().to_bytes().to_vec()],
            key_id: bls12_381_test_key_1(),
        };

        let future = ic_cdk::api::call::call::<_, (VetKDPublicKeyReply,)>(
            vetkd_system_api_canister_id(),
            "vetkd_public_key",
            (request,),
        );

        future.map(|call_result| {
            let (reply,) = call_result.expect("call to vetkd_public_key failed");
            VetKeyVerificationKey::from(reply.public_key)
        })
    }

    /// Retrieves an encrypted vetkey for caller and key id.
    ///
    /// # Errors
    ///
    /// Returns an error if the caller doesn't have read permission for the key.
    ///
    /// # Panics
    ///
    /// Panics if the call to the `vetkd_encrypted_key` API fails.
    pub fn get_encrypted_vetkey(
        &mut self,
        caller: Principal,
        key_id: KeyId,
        transport_key: TransportKey,
    ) -> Result<impl Future<Output = VetKey> + Send + Sync, String> {
        use futures::future::FutureExt;

        let access_rights = self.ensure_user_can_read(caller, key_id)?;
        
        // Check if this is the first access to this key (implicit creation)
        // We consider a key created when the owner first accesses it and it has no access records
        let is_owner = caller == key_id.0;
        let no_shared_records = !self.shared_keys.range((key_id, Principal::management_canister())..)
            .take_while(|((k, _), _)| k == &key_id)
            .any(|_| true);
            
        // If this is the owner's first access, log a creation event
        if is_owner && no_shared_records {
            self.add_audit_log(key_id, move || {
                AuditEntry::created(now(), caller)
            });
        }

        // Log the access - using closure to avoid allocation if audit is disabled
        self.add_audit_log(key_id, move || {
            AuditEntry::access_vet_key(now(), caller, access_rights)
        });

        let derivation_id = key_id
            .0
            .as_slice()
            .iter()
            .chain(key_id.1.as_ref().iter())
            .copied()
            .collect();

        let request = VetKDEncryptedKeyRequest {
            derivation_id,
            public_key_derivation_path: vec![self.domain_separator.get().to_bytes().to_vec()],
            key_id: bls12_381_test_key_1(),
            encryption_public_key: transport_key.into(),
        };

        let future = ic_cdk::api::call::call::<_, (VetKDEncryptedKeyReply,)>(
            vetkd_system_api_canister_id(),
            "vetkd_encrypted_key",
            (request,),
        );

        Ok(future.map(|call_result| {
            let (reply,) = call_result.expect("call to vetkd_encrypted_key failed");
            VetKey::from(reply.encrypted_key)
        }))
    }

    /// Retrieves the access rights a given user has to a specific key.
    ///
    /// # Errors
    ///
    /// Returns an error if the caller doesn't have read permission for the key.
    pub fn get_user_rights(
        &self,
        caller: Principal,
        key_id: KeyId,
        user: Principal,
    ) -> Result<Option<AccessRights>, String> {
        self.ensure_user_can_read(caller, key_id)?;
        if let Ok(access_rights) = self.ensure_user_can_read(user, key_id) {
            return Ok(Some(access_rights));
        }
        Ok(None)
    }

    /// Grants or modifies access rights for a user to a given key.
    /// Only the key owner or a user with management rights can perform this action.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The caller doesn't have manage permission for the key
    /// - The caller is trying to change their own rights as key owner
    pub fn set_user_rights(
        &mut self,
        caller: Principal,
        key_id: KeyId,
        user: Principal,
        access_rights: AccessRights,
    ) -> Result<Option<AccessRights>, String> {
        self.ensure_user_can_manage(caller, key_id)?;

        if caller == key_id.0 && caller == user {
            return Err("cannot change key owner's user rights".to_string());
        }

        // Log the share action - using closure to avoid allocation if audit is disabled
        self.add_audit_log(key_id, move || {
            AuditEntry::share(now(), caller, user, access_rights)
        });

        self.shared_keys.insert((key_id, user), ());
        Ok(self.access_control.insert((user, key_id), access_rights))
    }

    /// Revokes a user's access to a shared key.
    /// The key owner cannot remove their own access.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The caller doesn't have manage permission for the key
    /// - The caller is the key owner and trying to remove themselves
    pub fn remove_user(
        &mut self,
        caller: Principal,
        key_id: KeyId,
        user: Principal,
    ) -> Result<Option<AccessRights>, String> {
        self.ensure_user_can_manage(caller, key_id)?;

        if caller == user && caller == key_id.0 {
            return Err("cannot remove key owner".to_string());
        }

        // If we're removing the owner's access rights from someone else,
        // consider this effectively deleting the key, since the owner is the primary access point
        let is_key_owner = user == key_id.0;
        
        if is_key_owner {
            // Log a key deletion event if we're removing the owner's access
            self.add_audit_log(key_id, move || {
                AuditEntry::deleted(now(), caller)
            });
        } else {
            // Otherwise, log the standard unshare action
            self.add_audit_log(key_id, move || {
                AuditEntry::unshare(now(), caller, user)
            });
        }

        self.shared_keys.remove(&(key_id, user));
        Ok(self.access_control.remove(&(user, key_id)))
    }

    /// Ensures that a user has read access to a key before proceeding.
    /// Returns an error if the user is not authorized.
    fn ensure_user_can_read(&self, user: Principal, key_id: KeyId) -> Result<AccessRights, String> {
        let is_owner = user == key_id.0;
        if is_owner {
            return Ok(AccessRights::read_write_manage());
        }

        let has_shared_access = self.access_control.get(&(user, key_id));
        if let Some(access_rights) = has_shared_access {
            if let Some(start) = access_rights.start() {
                if start > now() {
                    return Err("unauthorized".to_string());
                }
            }
            if let Some(end) = access_rights.end() {
                if end <= now() {
                    return Err("unauthorized".to_string());
                }
            }
            return Ok(access_rights);
        }

        // Allow anonymous access if it exists for the content.
        // Recognize 2vxsx-fae as an "everyone" user.
        let has_shared_access = self.access_control.get(&(Principal::anonymous(), key_id));
        if let Some(access_rights) = has_shared_access {
            if let Some(start) = access_rights.start() {
                if start > now() {
                    return Err("unauthorized".to_string());
                }
            }
            if let Some(end) = access_rights.end() {
                if end <= now() {
                    return Err("unauthorized".to_string());
                }
            }
            return Ok(access_rights);
        }

        Err("unauthorized".to_string())
    }

    /// Ensures that a user has management access to a key before proceeding.
    /// Returns an error if the user is not authorized.
    fn ensure_user_can_manage(
        &self,
        user: Principal,
        key_id: KeyId,
    ) -> Result<AccessRights, String> {
        let is_owner = user == key_id.0;
        if is_owner {
            return Ok(AccessRights::read_write_manage());
        }

        let has_shared_access = self.access_control.get(&(user, key_id));
        if let Some(access_rights) = has_shared_access {
            if let Some(start) = access_rights.start() {
                if start < now() {
                    return Err("unauthorized".to_string());
                }
            }
            if let Some(end) = access_rights.end() {
                if end >= now() {
                    return Err("unauthorized".to_string());
                }
            }
            if access_rights.rights == Rights::ReadWriteManage {
                return Ok(access_rights);
            }
        }
        // We do not want to allow anonymous management access ever.

        Err("unauthorized".to_string())
    }

    /// Adds an audit log entry for a specific key ID.
    ///
    /// This method takes a closure that produces an audit entry, which is only called
    /// if audit logging is enabled. This avoids unnecessary allocations when auditing is disabled.
    ///
    /// # Arguments
    ///
    /// * `key_id` - The ID of the key to which the audit log entry belongs
    /// * `audit_fn` - A closure that returns an AuditEntry when called
    pub fn add_audit_log<F>(&mut self, key_id: KeyId, audit_fn: F)
    where
        F: FnOnce() -> AuditEntry,
    {
        if let Some(audit_logs) = &mut self.audit_logs {
            // Only create the AuditEntry if we have audit logs enabled
            let audit = audit_fn();
            
            match audit_logs.get(&key_id) {
                Some(existing_logs) => {
                    let mut new_logs = AuditLog(existing_logs.0.clone());
                    new_logs.0.push(audit);
                    audit_logs.insert(key_id, new_logs);
                }
                None => {
                    let new_logs = AuditLog(vec![audit]);
                    audit_logs.insert(key_id, new_logs);
                }
            }
        }
    }
}

fn bls12_381_test_key_1() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381,
        name: "insecure_test_key_1".to_string(),
    }
}

fn vetkd_system_api_canister_id() -> CanisterId {
    #[cfg(feature = "expose-testing-api")]
    {
        if let Some(canister_id) = VETKD_TESTING_CANISTER_ID.with(|cell| *cell.borrow()) {
            return canister_id;
        }
    }
    CanisterId::from_str(VETKD_SYSTEM_API_CANISTER_ID).expect("failed to create canister ID")
}

#[cfg(feature = "expose-testing-api")]
pub fn set_vetkd_testing_canister_id(canister_id: Principal) {
    VETKD_TESTING_CANISTER_ID.with(|cell| {
        *cell.borrow_mut() = Some(canister_id);
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_vetkd_canister_id_should_be_management_canister_id() {
        assert_eq!(
            vetkd_system_api_canister_id(),
            CanisterId::from_str("aaaaa-aa").unwrap()
        );
    }
}
