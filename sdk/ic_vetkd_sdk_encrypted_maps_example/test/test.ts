import { HttpAgent } from "@dfinity/agent";
import { DefaultEncryptedMapsClient } from "../src/index";
import { describe, expect, test, it } from '@jest/globals';
import fetch from 'isomorphic-fetch';

test('smoke test', async () => {
  const host = 'http://127.0.0.1:4943';
  const agent = new HttpAgent({ fetch, host });
  let canisterId = process.env.CANISTER_ID_ENCRYPTED_MAPS_EXAMPLE as string;
  let encrypted_maps = new DefaultEncryptedMapsClient(agent, canisterId);
  let names = await encrypted_maps.get_accessible_shared_map_names();
  expect(names.length === 0).toBeTruthy();
});
