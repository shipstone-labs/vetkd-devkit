import { bls12_381 } from '@noble/curves/bls12-381';
import { ProjPointType } from '@noble/curves/abstract/weierstrass';
import { Fp, Fp2 } from '@noble/curves/abstract/tower';
import { expand_message_xmd, hash_to_field } from '@noble/curves/abstract/hash-to-curve';

export type G1Point = ProjPointType<Fp>;
export type G2Point = ProjPointType<Fp2>;

const G1_BYTES = 48;
const G2_BYTES = 96;

export class TransportSecretKey {
    sk: Uint8Array;
    pk: G1Point;

    constructor(sk: Uint8Array) {
        if(sk.length != 32) {
            throw new Error("Invalid size for transport secret key");
        }

        this.sk = sk;

        const pk = bls12_381.G1.ProjectivePoint.fromPrivateKey(this.sk);
        this.pk = pk;
    }

    static random() {
        return new TransportSecretKey(bls12_381.utils.randomPrivateKey());
    }

    publicKeyBytes(): Uint8Array {
        return this.pk.toRawBytes(true);
    }
}

export class DerivedPublicKey {
    pk: G2Point;

    constructor(bytes: Uint8Array) {
        const pk = bls12_381.G2.ProjectivePoint.fromHex(bytes);
        this.pk = pk;
    }

    publicKeyBytes(): Uint8Array {
        return this.pk.toRawBytes(true);
    }
}

export function hashToScalar(input: Uint8Array, domainSep: string): bigint {
    const params = {
      p: bls12_381.params.r,
      m: 1,
      DST: domainSep,
    };

    // @ts-expect-error
    const options = Object.assign({}, bls12_381.G2.CURVE.htfDefaults, params);

    const scalars = hash_to_field(input, 1, options);

    return scalars[0][0];
}

export function deriveSymmetricKey(input: Uint8Array, domainSep: string, outputLength: number): Uint8Array {
    const dst = new Uint8Array(new TextEncoder().encode(domainSep));

    // @ts-expect-error
    const sha256 = bls12_381.G2.CURVE.htfDefaults.hash;

    return expand_message_xmd(input, dst, outputLength, sha256);
}

export function augmentedHashToG1(pk: DerivedPublicKey, message: Uint8Array): G1Point {
    const domainSep = "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_AUG_";
    const pkbytes = pk.publicKeyBytes();
    const input = new Uint8Array([...pkbytes, ...message]);
    const pt = bls12_381.G1.ProjectivePoint.fromAffine(bls12_381.G1.hashToCurve(input, {
        DST: domainSep
    }).toAffine());

    return pt;
}

export class VetKD {
    pt: G1Point;
    bytes: Uint8Array;

    constructor(pt: G1Point) {
        this.pt = pt;
        this.bytes = pt.toRawBytes(true);
    }

    /// A VetKD is a valid BLS signature
    signatureBytes(): Uint8Array {
        return this.bytes;
    }

    /// Derive a symmetric key from this VetKD
    deriveSymmetricKey(domainSep: string, outputLength: number): Uint8Array {
        return deriveSymmetricKey(this.bytes, domainSep, outputLength);
    }

    /// Derive a BLS12-381 secret key from this VetKD
    deriveBls12381SecretKey(domainSep: string, outputLength: number): bigint {
        return hashToScalar(this.bytes, domainSep);
    }
}

export class EncryptedKey {
    c1: G1Point;
    c2: G2Point;
    c3: G1Point;

    constructor(bytes: Uint8Array) {
        if(bytes.length != G1_BYTES + G2_BYTES + G1_BYTES) {
            throw new Error("Invalid EncryptedKey serialization");
        }

        this.c1 = bls12_381.G1.ProjectivePoint.fromHex(bytes.subarray(0, G1_BYTES));
        this.c2 = bls12_381.G2.ProjectivePoint.fromHex(bytes.subarray(G1_BYTES, G1_BYTES + G2_BYTES));
        this.c3 = bls12_381.G1.ProjectivePoint.fromHex(bytes.subarray(G1_BYTES + G2_BYTES));
    }

    decryptAndVerify(tsk: TransportSecretKey, dpk: DerivedPublicKey, did: Uint8Array): VetKD {
        // Compute the purported vetkd k
        const c1_tsk = this.c1.multiply(bls12_381.G1.normPrivateKeyToScalar(tsk.sk));
        const k = this.c3.subtract(c1_tsk);

        // Verify that k is a valid BLS signature
        const msg = augmentedHashToG1(dpk, did);
        const neg_g2 = bls12_381.G2.ProjectivePoint.BASE.negate();
        const check = bls12_381.pairingBatch([{ g1: k, g2: neg_g2}, { g1: msg, g2: dpk.pk }]);

        const one = bls12_381.fields.Fp12.ONE;
        const valid = bls12_381.fields.Fp12.eql(check, one);

        if(valid) {
            return new VetKD(k);
        } else {
            throw new Error("Invalid VetKD");
        }
    }
}

function hashToMask(seed: Uint8Array, msg: Uint8Array): bigint {
    const ro_input = new Uint8Array([ ...seed, ...msg]);
    return hashToScalar(ro_input, "ic-crypto-vetkd-bls12-381-ibe-mask-seed");
}

function xorBuf(a: Uint8Array, b: Uint8Array): Uint8Array {
    if(a.length != b.length) {
        throw new Error("xorBuf arguments should have the same length");
    }
    const c = new Uint8Array(a.length);
    for(let i = 0; i < a.length; i++) {
        c[i] = a[i] ^ b[i];
    }
    return c;
}

function maskSeed(seed: Uint8Array, t: Uint8Array): Uint8Array {
    if(t.length != 576) {
        throw new Error("Unexpected size for Gt element");
    }
    const mask = deriveSymmetricKey(t, "ic-crypto-vetkd-bls12-381-ibe-mask-seed", seed.length);
    return xorBuf(mask, seed);
}

function maskMsg(msg: Uint8Array, seed: Uint8Array): Uint8Array {
    const mask = deriveSymmetricKey(seed, "ic-crypto-vetkd-bls12-381-ibe-mask-msg", msg.length);

    // TODO handle larger messages (eg using AES)
    return xorBuf(msg, mask);
}

// What the fuck are you doing Javascript
function isEqual(x: Uint8Array, y: Uint8Array): boolean {
    if (x.length !== y.length) {
        return false
    }

    return x.every((value, index) => value === y[index])
}

const SEED_BYTES = 32;

export class IdentityBasedEncryptionCiphertext {
    c1: G2Point;
    c2: Uint8Array;
    c3: Uint8Array;

    serialize(): Uint8Array {
        let c1bytes = this.c1.toRawBytes(true);
        return new Uint8Array([...c1bytes, ...this.c2, ...this.c3]);
    }

    constructor(c1: G2Point, c2: Uint8Array, c3: Uint8Array) {
        this.c1 = c1;
        this.c2 = c2;
        this.c3 = c3;
    }

    static deserialize(bytes: Uint8Array): IdentityBasedEncryptionCiphertext {
        if(bytes.length < G2_BYTES + SEED_BYTES) {
            throw new Error("Invalid IBE ciphertext");
        }

        const c1 = bls12_381.G2.ProjectivePoint.fromHex(bytes.subarray(0, G2_BYTES));
        const c2 = bytes.subarray(G2_BYTES, G2_BYTES + SEED_BYTES);
        const c3 = bytes.subarray(G2_BYTES + SEED_BYTES);

        return new IdentityBasedEncryptionCiphertext(c1, c2, c3);
    }

    static encrypt(dpk: DerivedPublicKey,
                   derivation_id: Uint8Array,
                   msg: Uint8Array,
                   seed: Uint8Array): IdentityBasedEncryptionCiphertext {

        if(seed.length != SEED_BYTES) {
            throw new Error("IBE seed must be exactly SEED_BYTES long");
        }

        const t = hashToMask(seed, msg);
        const pt = augmentedHashToG1(dpk, derivation_id);
        const tsig = bls12_381.fields.Fp12.pow(bls12_381.pairing(pt, dpk.pk), t);

        const c1 = bls12_381.G2.ProjectivePoint.BASE.multiply(t);
        const c2 = maskSeed(seed, bls12_381.fields.Fp12.toBytes(tsig));
        const c3 = maskMsg(msg, seed);

        return new IdentityBasedEncryptionCiphertext(c1, c2, c3);
    }

    decrypt(vetkd: VetKD): Uint8Array {
        const k_c1 = bls12_381.pairing(vetkd.pt, this.c1);

        const seed = maskSeed(this.c2, bls12_381.fields.Fp12.toBytes(k_c1));

        const msg = maskMsg(this.c3, seed);

        const t = hashToMask(seed, msg);

        const g2_t = bls12_381.G2.ProjectivePoint.BASE.multiply(t);

        const valid = isEqual(g2_t.toRawBytes(true), this.c1.toRawBytes(true));

        if(valid) {
            return msg;
        } else {
            throw new Error("Decryption failed");
        }
    }

}
