use std::{borrow::Cow, convert::TryInto};

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
    pub fn iter() -> impl Iterator<Item = Self> {
        vec![
            Self::read_only(),
            Self::read_write(),
            Self::read_write_manage(),
        ]
        .into_iter()
    }

    #[must_use]
    pub const fn get_rights(&self) -> Rights {
        self.rights
    }

    #[must_use]
    pub const fn get_start(&self) -> Option<u64> {
        self.start
    }

    #[must_use]
    pub const fn get_end(&self) -> Option<u64> {
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
            assert!(start_time <= end_time, "start time must be before or equal to end time");
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
    static MOCK_NOW: std::cell::RefCell<u64> = std::cell::RefCell::new(0);
}

#[cfg(any(test, feature = "mock-time"))]
pub fn set_mock_now(t: u64) {
    MOCK_NOW.with(|v| *v.borrow_mut() = t);
}
