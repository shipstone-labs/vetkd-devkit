use assert_matches::assert_matches;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager},
    DefaultMemoryImpl,
};
use ic_vetkd_cdk_key_manager::KeyManager;
use ic_vetkd_cdk_test_utils::{
    random_access_rights, random_name, random_self_authenticating_principal,
    random_unique_memory_ids, reproducible_rng,
};
use ic_vetkd_cdk_types::{AccessRights, MemoryInitializationError};

#[test]
fn can_init_memory() {
    let rng = &mut reproducible_rng();
    let memory_manager = MemoryManager::init(DefaultMemoryImpl::default());
    let (_memory_id_encrypted_maps, memory_ids_key_manager) = random_unique_memory_ids(rng);
    KeyManager::try_init(
        memory_manager.get(MemoryId::new(memory_ids_key_manager[0])),
        memory_manager.get(MemoryId::new(memory_ids_key_manager[1])),
    )
    .unwrap();
}

#[test]
fn memory_init_twice_fails() {
    let rng = &mut reproducible_rng();
    let memory_manager = MemoryManager::init(DefaultMemoryImpl::default());
    let (_memory_id_encrypted_maps, memory_ids_key_manager) = random_unique_memory_ids(rng);
    KeyManager::try_init(
        memory_manager.get(MemoryId::new(memory_ids_key_manager[0])),
        memory_manager.get(MemoryId::new(memory_ids_key_manager[1])),
    )
    .unwrap();
    let result = KeyManager::try_init(
        memory_manager.get(MemoryId::new(memory_ids_key_manager[0])),
        memory_manager.get(MemoryId::new(memory_ids_key_manager[1])),
    );
    assert_eq!(result, Err(MemoryInitializationError::AlreadyInitialized));
}

#[test]
fn can_add_user_to_map() {
    let rng = &mut reproducible_rng();
    let caller = random_self_authenticating_principal(rng);
    let name = random_name(rng);

    let memory_manager = MemoryManager::init(DefaultMemoryImpl::default());
    let (_memory_id_encrypted_maps, memory_ids_key_manager) = random_unique_memory_ids(rng);
    KeyManager::try_init(
        memory_manager.get(MemoryId::new(memory_ids_key_manager[0])),
        memory_manager.get(MemoryId::new(memory_ids_key_manager[1])),
    )
    .unwrap();

    let user_to_be_added = random_self_authenticating_principal(rng);
    let access_rights = random_access_rights(rng);
    assert_eq!(
        ic_vetkd_cdk_key_manager::set_user_rights(
            caller,
            (caller, name.clone()),
            user_to_be_added,
            access_rights
        ),
        Ok(None)
    );
    assert_eq!(
        ic_vetkd_cdk_key_manager::set_user_rights(
            caller,
            (caller, name),
            user_to_be_added,
            access_rights
        ),
        Ok(Some(access_rights))
    );
}

#[test]
fn can_remove_user_from_map() {
    let rng = &mut reproducible_rng();
    let caller = random_self_authenticating_principal(rng);
    let name = random_name(rng);
    let memory_manager = MemoryManager::init(DefaultMemoryImpl::default());
    let (_memory_id_encrypted_maps, memory_ids_key_manager) = random_unique_memory_ids(rng);
    KeyManager::try_init(
        memory_manager.get(MemoryId::new(memory_ids_key_manager[0])),
        memory_manager.get(MemoryId::new(memory_ids_key_manager[1])),
    )
    .unwrap();

    let user_to_be_added = random_self_authenticating_principal(rng);
    let access_rights = random_access_rights(rng);
    assert_eq!(
        ic_vetkd_cdk_key_manager::set_user_rights(
            caller,
            (caller, name.clone()),
            user_to_be_added,
            access_rights,
        ),
        Ok(None)
    );
    assert_eq!(
        ic_vetkd_cdk_key_manager::remove_user(caller, (caller, name), user_to_be_added,),
        Ok(Some(access_rights))
    );
}

#[test]
fn add_or_remove_user_by_unauthorized_fails() {
    let rng = &mut reproducible_rng();
    let caller = random_self_authenticating_principal(rng);
    let name = random_name(rng);
    let memory_manager = MemoryManager::init(DefaultMemoryImpl::default());
    let (_memory_id_encrypted_maps, memory_ids_key_manager) = random_unique_memory_ids(rng);
    KeyManager::try_init(
        memory_manager.get(MemoryId::new(memory_ids_key_manager[0])),
        memory_manager.get(MemoryId::new(memory_ids_key_manager[1])),
    )
    .unwrap();

    let mut unauthorized_callers = vec![random_self_authenticating_principal(rng)];

    for access_rights in [AccessRights::Read, AccessRights::ReadWrite] {
        let user_to_be_added = random_self_authenticating_principal(rng);

        assert_matches!(
            ic_vetkd_cdk_key_manager::set_user_rights(
                caller,
                (caller, name.clone()),
                user_to_be_added,
                access_rights,
            ),
            Ok(_)
        );

        unauthorized_callers.push(user_to_be_added);
    }

    for unauthorized_caller in unauthorized_callers {
        for target in [random_self_authenticating_principal(rng), caller] {
            assert_eq!(
                ic_vetkd_cdk_key_manager::remove_user(
                    unauthorized_caller,
                    (caller, name.clone()),
                    target
                ),
                Err(format!("{unauthorized_caller} unauthorized"))
            );
            assert_eq!(
                ic_vetkd_cdk_key_manager::set_user_rights(
                    unauthorized_caller,
                    (caller, name.clone()),
                    target,
                    AccessRights::Read,
                ),
                Err(format!("{unauthorized_caller} unauthorized"))
            );
        }
    }
}

// TODO tests
// - create key
// - retrieve vetkey
// - retrieve vetkey and verification and and verify
// - add a user to a key
// - remove a user from a key
// - change user rights for a key
