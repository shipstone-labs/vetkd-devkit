import { HttpAgent } from "@dfinity/agent";
import { DefaultKeyManagerClient } from "../src/index";
import { describe, expect, test, it } from '@jest/globals';
import fetch from 'isomorphic-fetch';

test('smoke test', async () => {
  const host = 'http://127.0.0.1:4943';
  const agent = new HttpAgent({ fetch, host });
  //expect(agent.isLocal()).toBeTruthy();
  let canisterId = "bkyz2-fmaaa-aaaaa-qaaaq-cai";
  let key_manager = new DefaultKeyManagerClient(agent, canisterId);
  let verification_key = await key_manager.get_accessible_shared_key_ids();
  expect(verification_key.length === 0).toBeTruthy();
});
