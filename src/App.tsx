import { Button, Container, Text, Image, Box, Link } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import {
  useAccount,
  useConnect,
  useContractRead,
  useContractWrite,
} from 'wagmi';
import abiFile from './abiFile.json';
import { motion } from 'framer-motion';

const CONTRACT_ADDRESS = '0xaa3906f986e0cd86e64c1e30ce500c1de1ef46ad';

const getOpenSeaURL = (tokenId: string | number) =>
  `https://testnets.opensea.io/assets/goerli/${CONTRACT_ADDRESS}/${tokenId}`;

function App() {
  const contractConfig = {
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: abiFile.abi,
  };
  const { data: tokenURI } = useContractRead(contractConfig, 'commonTokenURI');
  const [imgURL, setImgURL] = useState('');

  const {
    writeAsync: mint,
    error: mintError,
    isLoading: mintLoading,
  } = useContractWrite(contractConfig, 'mint');
  const { data: accountData } = useAccount();
  const { isConnected } = useConnect();
  const [mintedTokenId, setMintedTokenId] = useState<number>();

  const onMintClick = async () => {
    try {
      const tx = await mint({
        args: [
          accountData?.address,
          { value: ethers.utils.parseEther('0.001') },
        ],
      });
      const receipt = await tx.wait();
      // @ts-ignore
      const mintedTokenId = await receipt.events[0].args[2].toString();
      setMintedTokenId(mintedTokenId);
    } catch (error) {}
  };

  useEffect(() => {
    (async () => {
      if (tokenURI) {
        const res = await (await fetch(tokenURI as unknown as string)).json();
        setImgURL(res.image);
      }
    })();
  }, [tokenURI]);

  return (
    <Container paddingY='10'>
      <ConnectButton />

      <Text marginTop='4'>This is the NFT we will be minting!</Text>

      <Box
        as={motion.div}
        borderColor='gray.200'
        borderWidth='1px'
        width='fit-content'
        marginTop='4'
        padding='6'
        shadow='md'
        rounded='lg'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image src={imgURL} width='200px' />
      </Box>

      <Button
        disabled={!isConnected || mintLoading}
        marginTop='6'
        onClick={onMintClick}
        fontSize='2xl'
        padding='8'
      >
        {isConnected ? '🎉 Mint' : '⚠️ Connect your wallet first!'}
      </Button>

      {mintError && (
        <Text textColor='red' marginTop='2'>
          {mintError.message}
        </Text>
      )}

      {mintedTokenId && (
        <Text marginTop='2'>
          🥳 Mint successful! You can view your NFT{' '}
          <Link
            isExternal
            href={getOpenSeaURL(mintedTokenId)}
            color='blue'
            textDecoration='underline'
          >
            here!
          </Link>
        </Text>
      )}
    </Container>
  );
}

export default App;
