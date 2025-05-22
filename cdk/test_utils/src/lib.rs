use std::{convert::TryInto, ops::Range};

use candid::Principal;
use ic_stable_structures::storable::Blob;
use ic_vetkd_cdk_types::{AccessRights, ByteBuf, KeyName};
use rand::{CryptoRng, Rng, SeedableRng};
use rand_chacha::ChaCha20Rng;
use std::convert::TryFrom;

#[must_use]
pub fn reproducible_rng() -> ChaCha20Rng {
    let seed = rand::thread_rng().gen();
    println!("RNG seed: {seed:?}");
    ChaCha20Rng::from_seed(seed)
}

/// Generates a set of unique memory IDs for testing purposes.
///
/// # Panics
///
/// Panics if the collection of unique memory IDs cannot be converted to a fixed-size array.
pub fn random_unique_memory_ids<R: Rng + CryptoRng>(rng: &mut R) -> (u8, [u8; 5]) {
    const MAX_MEMORY_ID: u8 = 254;
    let mut set = std::collections::HashSet::<u8>::new();
    let mut unique_memory_ids = [0; 6];
    while set.len() != unique_memory_ids.len() {
        set.insert(rng.gen_range(0..=MAX_MEMORY_ID));
    }
    unique_memory_ids = set.into_iter().collect::<Vec<u8>>().try_into().unwrap();

    let memory_id_encrypted_maps = unique_memory_ids[0];
    let memory_ids_key_manager = [
        unique_memory_ids[1],
        unique_memory_ids[2],
        unique_memory_ids[3],
        unique_memory_ids[4],
        unique_memory_ids[5],
    ];
    (memory_id_encrypted_maps, memory_ids_key_manager)
}

pub fn random_name<R: Rng + CryptoRng>(rng: &mut R) -> KeyName {
    random_blob(rng)
}

/// Generates a random blob of fixed size for testing.
///
/// # Panics
///
/// Panics if the generated data cannot be converted to a Blob.
pub fn random_blob<R: Rng + CryptoRng, const N: usize>(rng: &mut R) -> Blob<N> {
    let mut result = [0u8; N];
    rng.fill_bytes(&mut result);
    Blob::try_from(result.as_slice()).unwrap()
}

pub fn random_bytebuf<R: Rng + CryptoRng>(rng: &mut R, range: Range<usize>) -> ByteBuf {
    let length: usize = rng.gen_range(range);
    let mut result: Vec<u8> = vec![0; length];
    rng.fill_bytes(&mut result);
    ByteBuf::from(result)
}

pub fn random_key<R: Rng + CryptoRng>(rng: &mut R) -> Blob<32> {
    random_blob(rng)
}

pub fn random_self_authenticating_principal<R: Rng + CryptoRng>(rng: &mut R) -> Principal {
    let mut fake_public_key = vec![0u8; 32];
    rng.fill_bytes(&mut fake_public_key);
    Principal::self_authenticating::<&[u8]>(fake_public_key.as_ref())
}

#[allow(clippy::never_loop)]
pub fn random_access_rights<R: Rng + CryptoRng>(rng: &mut R) -> AccessRights {
    let data = rng.gen_range(0..=2);
    let rights = match data {
        0 => ic_vetkd_cdk_types::Rights::Read,
        1 => ic_vetkd_cdk_types::Rights::ReadWrite,
        2 => ic_vetkd_cdk_types::Rights::ReadWriteManage,
        _ => unreachable!(),
    };
    AccessRights::new(rights, None, None)
}

pub fn random_utf8_string<R: Rng + CryptoRng>(rng: &mut R, len: usize) -> String {
    rng.sample_iter::<char, _>(&rand::distributions::Standard)
        .take(len)
        .collect()
}
