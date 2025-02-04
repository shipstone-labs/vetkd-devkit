// import { HttpAgent } from "@dfinity/agent";
// import fetch from 'isomorphic-fetch';
// import * as ic_vetkd_sdk_key_manager_example from "../src/index.js";
// import { expect } from 'chai';
// import 'mocha';

// describe('smoke test',
//   () => {
//     it('should return true', async () => {
//       const ic_vetkd_sdk_key_manager_example = await import("/Users/alex/Code/vetkd-devkit/sdk/ic_vetkd_sdk_key_manager_example/src/index.js");
//       const host = 'http://127.0.0.1:4943';
//       const agent = new HttpAgent({ fetch, host });
//       let canisterId = process.env.CANISTER_ID_KEY_MANAGER_EXAMPLE as string;
//       let key_manager = new ic_vetkd_sdk_key_manager_example.DefaultKeyManagerClient(agent, canisterId);
//       let ids = await key_manager.get_accessible_shared_key_ids();
//       expect(ids.length === 0).to.equal(true);
//     });
//   });

  import { HttpAgent } from "@dfinity/agent";
  import fetch from 'isomorphic-fetch';
  import * as ic_vetkd_sdk_key_manager_example from "../src/index";
  import { expect } from 'chai';
  import 'mocha';
  
  describe('smoke test',
    () => {
      it('should return true', async () => {

      });
    });