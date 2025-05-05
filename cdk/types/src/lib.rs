use std::borrow::Cow;

use candid::{CandidType, Decode, Encode};
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};
use serde::Deserialize;

pub type KeyName = Blob<32>;
pub type MapName = KeyName;
pub type MapId = KeyId;
pub type KeyId = (candid::Principal, KeyName);
pub type MapKey = Blob<32>;
pub type TransportKey = ByteBuf;
pub type EncryptedMapValue = ByteBuf;

#[repr(u8)]
#[derive(
    CandidType,
    Deserialize,
    Clone,
    Copy,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Debug,
    strum_macros::FromRepr,
    strum_macros::EnumIter,
)]
pub enum Rights {
    Read = 0,
    ReadWrite = 1,
    ReadWriteManage = 2,
}

#[derive(CandidType, Deserialize, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub struct AccessRights {
    pub rights: Rights,
    pub start: Option<u64>,
    pub end: Option<u64>,
}

impl Default for AccessRights {
    fn default() -> Self {
        Self {
            rights: Rights::Read,
            start: None,
            end: None,
        }
    }
}

impl AccessRights {
    #[cfg(any(test, feature = "mock-time"))]
    pub fn iter() -> impl Iterator<Item = Self> {
        vec![
            Self::read_only(),
            Self::read_write(),
            Self::read_write_manage(),
        ]
        .into_iter()
    }

    #[must_use]
    pub const fn rights(&self) -> Rights {
        self.rights
    }

    #[must_use]
    pub const fn start(&self) -> Option<u64> {
        self.start
    }

    #[must_use]
    pub const fn end(&self) -> Option<u64> {
        self.end
    }

    #[must_use]
    pub const fn read_only() -> Self {
        Self {
            rights: Rights::Read,
            start: None,
            end: None,
        }
    }

    #[must_use]
    pub const fn read_write() -> Self {
        Self {
            rights: Rights::ReadWrite,
            start: None,
            end: None,
        }
    }

    #[must_use]
    pub const fn read_write_manage() -> Self {
        Self {
            rights: Rights::ReadWriteManage,
            start: None,
            end: None,
        }
    }

    /// Creates a new `AccessRights` with the given rights and optional start/end times.
    ///
    /// # Panics
    ///
    /// Panics if both start and end times are provided and start time is greater than end time.
    #[must_use]
    pub fn new(rights: Rights, start: Option<u64>, end: Option<u64>) -> Self {
        // Validate that start time is before end time if both are provided
        if let (Some(start_time), Some(end_time)) = (start, end) {
            assert!(
                start_time <= end_time,
                "start time must be before or equal to end time"
            );
        }
        Self { rights, start, end }
    }
}

impl Storable for AccessRights {
    fn to_bytes(&self) -> Cow<[u8]> {
        let rights = self.rights as u8;
        let start = self.start.unwrap_or(0);
        let end: u64 = self.end.unwrap_or(0);
        let mut bytes = [0u8; 1 + 8 + 8];
        bytes[0] = rights;
        bytes[1..9].copy_from_slice(&start.to_le_bytes()); // or .to_be_bytes()
        bytes[9..].copy_from_slice(&end.to_le_bytes()); // or .to_be_bytes()
        Cow::Owned(bytes.to_vec())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        let bytes = bytes.as_ref();
        assert!(bytes.len() == 17, "Invalid format: expected 17 bytes");
        let rights = bytes[0];
        let start = u64::from_le_bytes(bytes[1..9].try_into().unwrap());
        let end = u64::from_le_bytes(bytes[9..17].try_into().unwrap());
        Self {
            rights: Rights::from_repr(rights).unwrap(),
            start: if start != 0 { Some(start) } else { None },
            end: if end != 0 { Some(end) } else { None },
        }
    }
    // Self::from_repr(v).unwrap()
    const BOUND: Bound = Bound::Bounded {
        max_size: 17,
        is_fixed_size: true,
    };
}

#[derive(CandidType, Deserialize, PartialEq, Eq, PartialOrd, Ord, Clone, Debug)]
pub struct ByteBuf {
    #[serde(with = "serde_bytes")]
    inner: Vec<u8>,
}

impl ByteBuf {
    #[must_use]
    pub const fn new() -> Self {
        Self { inner: Vec::new() }
    }
}

impl From<Vec<u8>> for ByteBuf {
    fn from(inner: Vec<u8>) -> Self {
        Self { inner }
    }
}

impl From<ByteBuf> for Vec<u8> {
    fn from(buf: ByteBuf) -> Self {
        buf.inner
    }
}

impl AsRef<[u8]> for ByteBuf {
    fn as_ref(&self) -> &[u8] {
        &self.inner
    }
}

impl Default for ByteBuf {
    fn default() -> Self {
        Self::new()
    }
}

impl Storable for ByteBuf {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    const BOUND: Bound = Bound::Unbounded;
}

#[repr(u8)]
#[derive(
    CandidType,
    Deserialize,
    Clone,
    Copy,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Debug,
    strum_macros::FromRepr,
    strum_macros::EnumIter,
)]
/// Represents different types of audit events that can be logged
pub enum AuditEntryType {
    /// A new resource was created
    Created = 0,
    /// An existing resource was updated
    Updated = 1,
    /// A resource was deleted
    Deleted = 2,
    /// Access to a resource was shared with another user
    Share = 3,
    /// Access to a resource was revoked from a user
    Unshare = 4,
    /// A VET key was accessed by the owner or a user with rights
    AccessVetKey = 5,
    /// A shared VET key was accessed by someone
    AccessSharedVetKey = 6,
    /// A resource was marked as logically deleted but preserved for audit purposes
    SoftDeleted = 7,
    /// A soft-deleted resource was restored
    Restored = 8,
}

#[derive(CandidType, Deserialize, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub struct AuditEntry {
    pub audit_type: AuditEntryType,
    pub timestamp: u64,
    pub caller: candid::Principal,
    pub user: Option<candid::Principal>,
    pub access_rights: Option<AccessRights>,
}

impl Storable for AuditEntry {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(&self).expect("Failed to encode AuditEntry"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(&bytes, AuditEntry).expect("Failed to decode AuditEntry")
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 256,
        is_fixed_size: false,
    };
}

#[derive(Debug, Clone, PartialEq, Eq, Default, CandidType, Deserialize)]
pub struct AuditLog(pub Vec<AuditEntry>);

impl Storable for AuditLog {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(&self.0).expect("failed to encode AuditLog"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        let vec: Vec<AuditEntry> =
            Decode!(&bytes, Vec<AuditEntry>).expect("failed to decode AuditLog");
        AuditLog(vec)
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl AuditEntry {
    #[must_use]
    pub fn new(
        audit_type: AuditEntryType,
        timestamp: u64,
        caller: candid::Principal,
        user: Option<candid::Principal>,
        access_rights: Option<AccessRights>,
    ) -> Self {
        Self {
            audit_type,
            timestamp,
            caller,
            user,
            access_rights,
        }
    }
    pub fn audit_type(&self) -> AuditEntryType {
        self.audit_type
    }
    pub fn timestamp(&self) -> u64 {
        self.timestamp
    }
    pub fn caller(&self) -> candid::Principal {
        self.caller
    }
    pub fn user(&self) -> Option<candid::Principal> {
        self.user
    }
    pub fn access_rights(&self) -> Option<AccessRights> {
        self.access_rights
    }

    /// A new resource was created
    pub fn created(timestamp: u64, caller: candid::Principal) -> Self {
        Self::new(AuditEntryType::Created, timestamp, caller, None, None)
    }

    /// An existing resource was updated
    pub fn updated(timestamp: u64, caller: candid::Principal) -> Self {
        Self::new(AuditEntryType::Updated, timestamp, caller, None, None)
    }

    /// A resource was deleted
    pub fn deleted(timestamp: u64, caller: candid::Principal) -> Self {
        Self::new(AuditEntryType::Deleted, timestamp, caller, None, None)
    }

    /// Access to a resource was shared with another user
    pub fn share(
        timestamp: u64,
        caller: candid::Principal,
        user: candid::Principal,
        access_rights: AccessRights,
    ) -> Self {
        Self::new(
            AuditEntryType::Share,
            timestamp,
            caller,
            Some(user),
            Some(access_rights),
        )
    }

    /// Access to a resource was revoked from a user
    pub fn unshare(timestamp: u64, caller: candid::Principal, user: candid::Principal) -> Self {
        Self::new(AuditEntryType::Unshare, timestamp, caller, Some(user), None)
    }

    /// A VET key was accessed by the owner or a user with rights
    pub fn access_vet_key(timestamp: u64, caller: candid::Principal, access_rights: AccessRights) -> Self {
        Self::new(
            AuditEntryType::AccessVetKey,
            timestamp,
            caller,
            None,
            Some(access_rights),
        )
    }

    /// A shared VET key was accessed by someone
    pub fn access_shared_vet_key(
        timestamp: u64,
        caller: candid::Principal,
        access_rights: AccessRights,
    ) -> Self {
        Self::new(
            AuditEntryType::AccessSharedVetKey,
            timestamp,
            caller,
            None,
            Some(access_rights),
        )
    }
    
    /// A resource was marked as logically deleted but preserved for audit purposes
    pub fn soft_deleted(timestamp: u64, caller: candid::Principal) -> Self {
        Self::new(AuditEntryType::SoftDeleted, timestamp, caller, None, None)
    }
    
    /// A soft-deleted resource was restored
    pub fn restored(timestamp: u64, caller: candid::Principal) -> Self {
        Self::new(AuditEntryType::Restored, timestamp, caller, None, None)
    }
}

#[must_use]
pub fn now() -> u64 {
    inner_now()
}

#[cfg(not(any(test, feature = "mock-time")))]
fn inner_now() -> u64 {
    ic_cdk::api::time()
}

#[cfg(any(test, feature = "mock-time"))]
fn inner_now() -> u64 {
    MOCK_NOW.with(|t| *t.borrow())
}

#[cfg(any(test, feature = "mock-time"))]
thread_local! {
    static MOCK_NOW: std::cell::RefCell<u64> = const { std::cell::RefCell::new(0) };
}

#[cfg(any(test, feature = "mock-time"))]
pub fn set_mock_now(t: u64) {
    MOCK_NOW.with(|v| *v.borrow_mut() = t);
}
