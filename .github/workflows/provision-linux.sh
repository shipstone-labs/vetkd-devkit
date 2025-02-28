#!/bin/bash

set -ex

# Enter temporary directory.
pushd /tmp

# Install cmake
sudo apt-get install --yes cmake

# Install rust
wget --output-document install-rustup.sh "https://sh.rustup.rs"
sudo bash install-rustup.sh -y
rustup target add wasm32-unknown-unknown

# Install wasmtime
wasmtime_version=0.33.1
curl -fsSLO "https://github.com/bytecodealliance/wasmtime/releases/download/v${wasmtime_version}/wasmtime-v${wasmtime_version}-x86_64-linux.tar.xz"
mkdir -p "${HOME}/bin"
tar -xf "wasmtime-v${wasmtime_version}-x86_64-linux.tar.xz" --directory "${HOME}/bin/"
mv "${HOME}/bin/wasmtime-v${wasmtime_version}-x86_64-linux/wasmtime" "${HOME}/bin/wasmtime"
rm "wasmtime-v${wasmtime_version}-x86_64-linux.tar.xz"

# Install wasi2ic
git clone https://github.com/wasm-forge/wasi2ic
cargo install --path wasi2ic --root "${HOME}"

# Install wasm-opt
version=117
curl -fsSLO "https://github.com/WebAssembly/binaryen/releases/download/version_117/binaryen-version_${version}-x86_64-linux.tar.gz"
tar -xzf "binaryen-version_${version}-x86_64-linux.tar.gz" --directory "${HOME}/" --strip-components 1
rm "binaryen-version_${version}-x86_64-linux.tar.gz"

# Set environment variables.
echo "$HOME/bin" >>$GITHUB_PATH
echo "$HOME/.cargo/bin" >>$GITHUB_PATH

# Exit temporary directory.
popd