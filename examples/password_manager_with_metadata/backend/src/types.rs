use std::borrow::Cow;

use candid::{CandidType, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PasswordMetadata {
    creation_date: u64,
    last_modification_date: u64,
    number_of_modifications: u64,
    last_modified_principal: Principal,
    tags: Vec<String>,
    url: String,
}

impl PasswordMetadata {
    pub fn new(caller: Principal, tags: Vec<String>, url: String) -> Self {
        let time_now = ic_cdk::api::time();
        Self {
            creation_date: time_now,
            last_modification_date: time_now,
            number_of_modifications: 0,
            last_modified_principal: caller,
            tags,
            url,
        }
    }

    pub fn update(self, caller: Principal, tags: Vec<String>, url: String) -> Self {
        let time_now = ic_cdk::api::time();
        Self {
            creation_date: self.creation_date,
            last_modification_date: time_now,
            number_of_modifications: self.number_of_modifications + 1,
            last_modified_principal: caller,
            tags,
            url,
        }
    }
}

impl Storable for PasswordMetadata {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(self).expect("failed to serialize"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).expect("failed to deserialize")
    }

    const BOUND: Bound = Bound::Unbounded;
}
