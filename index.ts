// @ts-check
import { getExplorerLink } from '@solana-developers/helpers'

import {
    PublicKey,
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
    SendTransactionError
} from '@solana/web3.js';

import {
    createAccount,
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    ExtensionType,
    getMintLen,
    LENGTH_SIZE,
    mintTo,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    TYPE_SIZE,
} from '@solana/spl-token';

import { createInitializeInstruction, pack, TokenMetadata } from '@solana/spl-token-metadata';

// Define the extensions to be used by the mint
const extensions = [
    ExtensionType.TransferFeeConfig,
    ExtensionType.MetadataPointer,
];

// Calculate the length of the mint
const mintLen = getMintLen(extensions); 

const payer = Keypair.generate();
const decimals = 9;


async function main() {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');


    //Airdrop some SOL
    const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction({ signature: airdropSignature, ...(await connection.getLatestBlockhash()) });


    const mintKeypair = Keypair.generate();
    console.log(mintKeypair.publicKey.toBase58());

    const mint = Keypair.generate();
    console.log(mint.publicKey.toBase58());

    const metadata: TokenMetadata = {
        mint: mint.publicKey,
        name: "Nata-Coin",
        symbol: "Nata-Coin",
        uri: "https://github.com/saidubundukamara/solana_meta_data/blob/main/metadata.json",
        additionalMetadata: [["description", "Only Possible On Solana"]],
    };

    const mintLen = getMintLen([ExtensionType.MetadataPointer]);

    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint.publicKey,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),

        createInitializeMetadataPointerInstruction(mint.publicKey, payer.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mint.publicKey, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),

        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            mint: mint.publicKey,
            metadata: metadata.mint,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            mintAuthority: payer.publicKey,
            updateAuthority: payer.publicKey,
        }),
     
    );
    await sendAndConfirmTransaction(connection, mintTransaction, [payer, mint]);

}

main();

