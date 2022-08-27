import React from 'react';
import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Keypair,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    transfer,
    Account,
    getMint,
    getAccount
} from '@solana/spl-token';

// special setup to add a Buffer class, because it's missing
window.Buffer = window.Buffer || require("buffer").Buffer;

function MintToken() {
    const connection = new Connection(clusterApiUrl('devnet'), "confirmed");
    const fromWallet = Keypair.generate(); // this would be the owner's wallet on mainnet
    let mint: PublicKey;
    let fromTokenAccount: Account;
    const toWallet = new PublicKey("BAHNBw7AAUFNqe8uyhqTNGVCkX4SpXR3C8fJSS1nEzWc");

    async function createToken() {
        const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(fromAirdropSignature); // we need to make sure the trx is completed

        // create new token mint
        // returns the public key of the token
        mint = await createMint(
            connection,
            fromWallet,
            fromWallet.publicKey,
            null,
            9
        );

        console.log(`Created token: ${mint.toBase58()}`);

        // Get the token account of the fromWallet address, and if it does not exist, create it
        fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            mint,
            fromWallet.publicKey
        );
        console.log(`Associated token account created : ${fromTokenAccount.address.toBase58()}`);
    }

    async function mintToken() {
        // Mint 1 new token to the "fromTokenAccount" account we just created
        const signature = await mintTo(
            connection,
            fromWallet,
            mint,
            fromTokenAccount.address,
            fromWallet.publicKey,
            10000000000 // 10 billion -> 10 tokens since we have 9 decimals
        );
        console.log(`Mint signature: ${signature}`);
        console.log(`Minted to: ${fromTokenAccount.address}`);
    }

    async function checkBalance() {
        // get the supply of tokens we have minted into existence
        const mintInfo = await getMint(connection, mint);
        console.log(mintInfo.supply);

        // get the amount of tokens left in the account
        const tokenAccountInfo = await getAccount(connection, fromTokenAccount.address);
        console.log(tokenAccountInfo.amount);
    }

    async function sendTokens(){
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, toWallet);
        console.log(`toTokenAccount ${toTokenAccount.address}`);

        const signature = await transfer(
            connection,
            fromWallet,
            fromTokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            1000000000 // 1 billion
        );
        console.log(`Finished transfer with signature ${signature}`);
    }

    return (
        <div>
            Tokenator 2000
            <div>
                <button onClick={createToken}>Create Token</button>
                <button onClick={mintToken}>Mint token</button>
                <button onClick={checkBalance}>Check balance</button>
                <button onClick={sendTokens}>Send Token</button>
            </div>
        </div>
    );
}

export default MintToken;
