import React from 'react';
import {
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction
} from '@solana/web3.js';
import {
    Account,
    AuthorityType,
    createMint,
    createSetAuthorityInstruction,
    getOrCreateAssociatedTokenAccount,
    mintTo
} from '@solana/spl-token';

// special setup to add a Buffer class, because it's missing
window.Buffer = window.Buffer || require("buffer").Buffer;

function MintNft() {
    const connection = new Connection(clusterApiUrl('devnet'), "confirmed");
    const fromWallet = Keypair.generate(); // this would be the owner's wallet on mainnet
    let mint: PublicKey;
    let fromTokenAccount: Account;

    async function createNFT() {
        const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(fromAirdropSignature); // we need to make sure the trx is completed

        // create new token mint
        // returns the public key of the token
        mint = await createMint(
            connection,
            fromWallet,
            fromWallet.publicKey,
            null,
            0 // only allow whole tokens
        );

        console.log(`Created NFT: ${mint.toBase58()}`);

        // Get the token account of the fromWallet address, and if it does not exist, create it
        fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            mint,
            fromWallet.publicKey
        );
        console.log(`Associated NFT account created : ${fromTokenAccount.address.toBase58()}`);
    }

    async function mintNFT() {
        // Mint 1 new token to the "fromTokenAccount" account we just created
        const signature = await mintTo(
            connection,
            fromWallet,
            mint,
            fromTokenAccount.address,
            fromWallet.publicKey,
            1
        );
        console.log(`Mint signature: ${signature}`);
    }

    async function lockNFT() {
        // Create our transaction to change the minting permissions
        let transaction = new Transaction().add(createSetAuthorityInstruction(
            mint,
            fromWallet.publicKey,
            AuthorityType.MintTokens,
            null
        ));

        // Send transaction
        const signature = await sendAndConfirmTransaction(connection, transaction, [fromWallet]);
        console.log(`Lock signature : ${signature}`);
    }

    return (
        <div>
            NFTerminator
            <div>
                <button onClick={createNFT}>Create NFT</button>
                <button onClick={mintNFT}>Mint NFT</button>
                <button onClick={lockNFT}>Lock NFT</button>
            </div>
        </div>
    );
}

export default MintNft;
