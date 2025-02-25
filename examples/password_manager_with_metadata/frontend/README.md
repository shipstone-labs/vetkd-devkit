# VetKD Password Manager with Medatadata Frontend

The `examples/password_manager` example uses the defaults provided by the devkit
to implement a VetKD-based password manager. This utilizes the encrypted maps
canister example to realize the password manager, i.e., there is no dedicated
canister implementation, only the frontend implementation that uses all defaults
from the SDK.

This example effectively extend the `examples/password_manager` example by
adding various metadata: 1) metadata created by the backend (password creation
and last modification date, the principal that last modified the password, and
the total number of modifications), and 2) metadata created by the frontend
(password tags and URL).

To extend `examples/password_manager`, the following steps were done:
* Backend
  *  Manually define the canister APIs (i.e., cannot use the default canister implementation).
  *  And extend the canister APIs where metadata was passed along with the encrypted
     values (map key-value retrieval, insertion, and removal).
* Frontend
  * Use the default SDK implementation for the calls that are unaffected by the
    metadata (e.g., setting and getting the user rights).
  * Manually implement data insertion with metadata in atomic calls using the
    `dfx`-generated canister client code. Use the SDK implementation for
    encryption.
  * Modify the UI to handle the metadata. 

## Step 1: Deploy `backend` canister and the internet identity canister.

## Step 2: Tell `frontend` what canisters to communicate with, so the following environment variables must be defined. For a local deployment, one can run `deploy_locally.sh` from that folder.
* `INTERNET_IDENTITY_CANISTER_ID`
* `CANISTER_ID_PASSWORD_MANAGER_WITH_METADATA`

## Step 3: Deploy frontend. This returns a link that can be used to access the frontend from the asset canister.
```shell
dfx deploy www
```
Note: if this returns a URL with the IP `0.0.0.0` and the fronetned does not
work, a potential fix is to replace it with `localhost`.