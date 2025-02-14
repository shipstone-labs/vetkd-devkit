import { DerivedPublicKey, EncryptedKey, IdentityBasedEncryptionCiphertext, TransportSecretKey, VetKD, augmentedHashToG1, hashToScalar, deriveSymmetricKey } from "../src/index";
import { assert, test } from 'vitest'

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
    return [...new Uint8Array (bytes)]
        .map (b => b.toString (16).padStart (2, "0"))
        .join ("");
}

test('creating random TransportSecretKey', async () => {
    let key = TransportSecretKey.random();

    let pk = key.publicKeyBytes();
    assert.deepEqual(pk.length, 48);
});

test('parsing DerivedPublicKey', async () => {
    try {
        const invalid = new Uint8Array([1, 2, 3]);
        let key = new DerivedPublicKey(invalid);
        assert.fail("DerivedPublicKey accepted invalid encoding");
    } catch(error) {}

    const valid = hexToBytes("972c4c6cc184b56121a1d27ef1ca3a2334d1a51be93573bd18e168f78f8fe15ce44fb029ffe8e9c3ee6bea2660f4f35e0774a35a80d6236c050fd8f831475b5e145116d3e83d26c533545f64b08464e4bcc755f990a381efa89804212d4eef5f");
    let key = new DerivedPublicKey(valid);
    assert.deepEqual(valid, key.publicKeyBytes());
});

test('augmented hash to G1', async() => {
    const pk = new DerivedPublicKey(hexToBytes("80e38f040fae321c75cf8faf8c6e9500c92b7cac022ca3eb48fb01c8e91d8c2bc806c2665ed28a0a8c87a4bff717dd3c0c4eb57ad635bc582f89c171b8478f2fe1b806c3faeed7133b13141aaf4a65aa0c5d7902dc80102e91e6f73fe56fa34f"));
    const msg = hexToBytes("25138dfc69267bd861d8ad9f05b9");

    const expected = hexToBytes("8e946e53188c951301b895c228c48cdeebf008d0fbc5b0aa8bff07a30926fb166485137dc372983433032673f74c24e6");

    const calculated = augmentedHashToG1(pk, msg);
});

test('protocol flow with precomputed data', async() => {
    const tsk = new TransportSecretKey(hexToBytes("167b736e44a1c134bd46ca834220c75c186768612568ac264a01554c46633e76"));

    const tpk = tsk.publicKeyBytes();

    assert.deepEqual(bytesToHex(tpk), "911969d56f42875d37a92d7eaa5d43293eff9f9a20ba4c60523e70a695eaeadeb721659b52a49d74e67841ad19033a12");

    const did = hexToBytes("6d657373616765");

    const dpk = new DerivedPublicKey(hexToBytes("972c4c6cc184b56121a1d27ef1ca3a2334d1a51be93573bd18e168f78f8fe15ce44fb029ffe8e9c3ee6bea2660f4f35e0774a35a80d6236c050fd8f831475b5e145116d3e83d26c533545f64b08464e4bcc755f990a381efa89804212d4eef5f"));

    const ek = new EncryptedKey(hexToBytes("b1a13757eaae15a3c8884fc1a3453f8a29b88984418e65f1bd21042ce1d6809b2f8a49f7326c1327f2a3921e8ff1d6c3adde2a801f1f88de98ccb40c62e366a279e7aec5875a0ce2f2a9f3e109d9cb193f0197eadb2c5f5568ee4d6a87e115910662e01e604087246be8b081fc6b8a06b4b0100ed1935d8c8d18d9f70d61718c5dba23a641487e72b3b25884eeede8feb3c71599bfbcebe60d29408795c85b4bdf19588c034d898e7fc513be8dbd04cac702a1672f5625f5833d063b05df7503"));

    const vetkd = ek.decryptAndVerify(tsk, dpk, did);

    assert.deepEqual(bytesToHex(vetkd.signatureBytes()),
                     "987db5406ce297e729c8564a106dc896943b00216a095fe9c5d32a16a330c02eb80e6f468ede83cde5462b5145b58f65");

    const symKey = vetkd.deriveSymmetricKey("QUUX-V01-CS02-with-expander-SHA256-128", 32);
    assert.deepEqual(bytesToHex(symKey), "4e91306f72d20c58379ddf86e40869706c8c533d40c277cd808abaf6ac623fc1");

    const message = hexToBytes("f00f11");
    const seed = new Uint8Array(32);
    const ibe = IdentityBasedEncryptionCiphertext.encrypt(dpk, did, message, seed);

    const ibeRec = IdentityBasedEncryptionCiphertext.deserialize(ibe.serialize());

    const rec = ibeRec.decrypt(vetkd);
    assert.deepEqual(bytesToHex(rec), "f00f11");
});

test('hash to scalar', async() => {
    const dst = "QUUX-V01-CS02-with-BLS12381SCALAR_XMD:SHA-256_SSWU_RO_";

    assert.deepEqual(hashToScalar(hexToBytes(""), dst).toString(16), "3b3fdf74b194c0a0f683d67a312a4e72d663d74b8478dc7b56be41e0ce11caa1");
    assert.deepEqual(hashToScalar(hexToBytes("616263"), dst).toString(16), "47e7a8839695a3df27f202cf71e295a8554b47cef75c1e316b1865317720e188");
});

test('xmd test vectors', async() => {
    const dst = "QUUX-V01-CS02-with-expander-SHA256-128";
    const testVectors = [
        ["", "68a985b87eb6b46952128911f2a4412bbc302a9d759667f87f7a21d803f07235"],
        ["616263", "d8ccab23b5985ccea865c6c97b6e5b8350e794e603b4b97902f53a8a0d605615"],
        ["61626364656630313233343536373839", "eff31487c770a893cfb36f912fbfcbff40d5661771ca4b2cb4eafe524333f5c1"],
        ["713132385f7171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171717171", "b23a1d2b4d97b2ef7785562a7e8bac7eed54ed6e97e29aa51bfe3f12ddad1ff9"],

        ["987db5406ce297e729c8564a106dc896943b00216a095fe9c5d32a16a330c02eb80e6f468ede83cde5462b5145b58f65", "4e91306f72d20c58379ddf86e40869706c8c533d40c277cd808abaf6ac623fc1"],
    ];

    for(const tv of testVectors) {
        const input = hexToBytes(tv[0]);
        const expected = tv[1];
        const outputLen = Math.trunc(expected.length / 2);

        const xmd = deriveSymmetricKey(input, dst, outputLen);
        assert.deepEqual(bytesToHex(xmd), expected);
    }
});
