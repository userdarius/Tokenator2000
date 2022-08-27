import React from 'react';
import {
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction, SystemProgram,
    Transaction
} from '@solana/web3.js';
import {
    closeAccount, createAssociatedTokenAccountInstruction,
    createSyncNativeInstruction, getAccount, getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    NATIVE_MINT, transfer
} from '@solana/spl-token';

// special setup to add a Buffer class, because it's missing
window.Buffer = window.Buffer || require("buffer").Buffer;

function SendSOL() {
    const connection = new Connection(clusterApiUrl('devnet'), "confirmed");
    const fromWallet = Keypair.generate(); // this would be the owner's wallet on mainnet
    let associatedTokenAccount: PublicKey;

    async function wrapSOL() {
        const airdropSignature = await connection.requestAirdrop(
            fromWallet.publicKey,
            2 * LAMPORTS_PER_SOL,
        );

        await connection.confirmTransaction(airdropSignature);
        associatedTokenAccount = await getAssociatedTokenAddress(
            NATIVE_MINT,  // WSOL address
            fromWallet.publicKey
        );

        console.log(associatedTokenAccount.toBase58());

        // Create token account to hold your wrapped SOL
        const ataTransaction = new Transaction().add(
            createAssociatedTokenAccountInstruction(
                fromWallet.publicKey,
                associatedTokenAccount,
                fromWallet.publicKey,
                NATIVE_MINT
            )
        );

        await sendAndConfirmTransaction(connection, ataTransaction, [fromWallet]);

        // Transfer SOL to associated token account and use SyncNative to update wrapped SOL balance
        const solTransferTransaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromWallet.publicKey,
                toPubkey: associatedTokenAccount,
                lamports: LAMPORTS_PER_SOL // The SOL that we're sending over
            }),
            createSyncNativeInstruction(
                associatedTokenAccount
            )
        );

        await sendAndConfirmTransaction(connection, solTransferTransaction, [fromWallet]);
        const accountInfo = await getAccount(connection, associatedTokenAccount);
        console.log(`Native : ${accountInfo.isNative}, Lamports : ${accountInfo.amount}`);
    }

    async function unwrapSOL() {
        const walletBalance = await connection.getBalance(fromWallet.publicKey);
        console.log(`Balance before unwrapping : ${walletBalance}`);

        await closeAccount(
            connection,
            fromWallet,
            associatedTokenAccount,
            fromWallet.publicKey,
            fromWallet
        );
        const walletBalancePostUnwrap = await connection.getBalance(fromWallet.publicKey);
        console.log(`Balance after unwrapping : ${walletBalancePostUnwrap}`);
    }

    async function sendSOL() {
        const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(fromAirdropSignature); // we need to make sure the trx is completed

        const toWallet = new PublicKey("BAHNBw7AAUFNqe8uyhqTNGVCkX4SpXR3C8fJSS1nEzWc");
        console.log(`Receiver: ${toWallet}`);

        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            NATIVE_MINT,
            fromWallet.publicKey
        );

        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            NATIVE_MINT,
            toWallet
        );

        const signature = await transfer(
            connection,
            fromWallet,
            fromTokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            LAMPORTS_PER_SOL
        );

        console.log(`Transfer signature : ${signature}`);
    }

    return (
        <div>
            SOL teleporter
            <div>
                <button onClick={wrapSOL}>Wrap SOL</button>
                <button onClick={unwrapSOL}>Unwrap SOL</button>
                <button onClick={sendSOL}>Send SOL</button>
            </div>
        </div>
    );
}

export default SendSOL;
