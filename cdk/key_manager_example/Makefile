.PHONY: compile-wasm
.SILENT: compile-wasm
compile-wasm:
	cargo build --release --target wasm32-unknown-unknown

.PHONY: extract-candid
.SILENT: extract-candid
extract-candid: compile-wasm
	candid-extractor ../../target/wasm32-unknown-unknown/release/ic_vetkd_cdk_key_manager_example.wasm > key_manager_example.did