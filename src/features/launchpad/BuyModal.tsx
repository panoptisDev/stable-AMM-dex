import React, { useState, useContext } from 'react'
import { classNames, formatBalance, formatNumber, formatNumberScale, formatPercent } from '../../functions'
import { t } from '@lingui/macro'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { isMobile } from 'react-device-detect'
import DoubleLogo from '../../components/DoubleLogo'
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'
import CurrencyLogo from '../../components/CurrencyLogo'
import { Token, ZERO, Percent, JSBI } from '../../sdk'
import Settings from '../../components/Settings'

import Button from '../../components/Button'
import Dots from '../../components/Dots'
import { AUTHTRAIL_IDO, BEAMCHEF_ADDRESS, SHARE_ADDRESS } from '../../constants/addresses'
import { Input as NumericalInput } from '../../components/NumericalInput'
import { getAddress } from '@ethersproject/address'
import { tryParseAmount } from '../../functions/parse'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import Progress from 'react-progressbar'

import { useCurrency, useToken } from '../../hooks/Tokens'
import { useV2PairsWithPrice } from '../../hooks/useV2Pairs'
import { GLINT_ADDRESS } from '../../constants/tokens'
import { WNATIVE } from '../../constants'
import { PriceContext } from '../../contexts/priceContext'
import { ApprovalState, useApproveCallback } from '../../hooks'
import { useV2LiquidityTokenPermit } from '../../hooks/useERC20Permit'
import { getIdoData, getIdoDataOptimized, getUserData, getUserDataOptimized, useIdoData } from './hooks'
import { IDOInfo } from '../../constants/idos'
import useIdoSc from './useIdoSc'
import { ethers } from 'ethers'
import Web3Connect from '../../components/Web3Connect'
import { FiatValue } from '../../components/CurrencyInputPanel/FiatValue'

interface IdoModalProps {
  isOpen: boolean
  onDismiss: () => void
  onClose: () => void
}

const BuyModal: React.FC<IdoModalProps> = ({ isOpen, onDismiss }) => {
  const { account, chainId } = useActiveWeb3React()

  const [view, setView] = useState('about')
  const [pendingTx, setPendingTx] = useState(false)
  const [lockTime, setLockTime] = useState("0") //  0 for no lock, 1 for 7 days, 2 for 30 days

  const [data, idoExists, idoChainId] = useIdoData(AUTHTRAIL_IDO[chainId])
  const idoData = data as IDOInfo
 /* const [totalRaised, saleOpen, claimOpen, canContribute, freeOpen, registrationOpen, raiseCap] = getIdoData(
    AUTHTRAIL_IDO[chainId],
    parseInt(chainId.toString()),
    idoData?.paymentToken?.decimals,
    idoData?.version
  )*/
  const [idoDataOptimized] = getIdoDataOptimized(
    AUTHTRAIL_IDO[chainId]
  )
  const freeOpen:boolean = idoDataOptimized?idoDataOptimized?.openForAll:false
  const [depositValue, setDepositValue] = useState('')
  const typedDepositValue = tryParseAmount('900000000000000000000000', useToken(SHARE_ADDRESS[chainId]))
  const [approvalState, approve] = useApproveCallback(typedDepositValue, AUTHTRAIL_IDO[chainId])
  const { register, unstake } = useIdoSc(AUTHTRAIL_IDO[chainId])
  /*const [tokenAmount, buyAmount, claimAmount, whiteListed, claimed, unlockTime, stakedBalance, tier, lockedTime] = getUserData(
    AUTHTRAIL_IDO[chainId],
    parseInt(idoChainId.toString()),
    account
  )*/
  const [userDataOptimized] = getUserDataOptimized(AUTHTRAIL_IDO[chainId]);
  const tokenAmount = userDataOptimized?userDataOptimized?.tokenAmount:"0"
  const unlockTime = userDataOptimized?userDataOptimized?.unlockTime:"0"
  const stakedBalance = userDataOptimized?userDataOptimized?.stakedBalance:"0"
  const time = parseFloat(unlockTime?.toString()) * 1000 - Date.parse(new Date().toString())
  const estimatedAllocation = Number(tokenAmount)
  const estimatedSwapAmount = estimatedAllocation * Number(idoData?.tokenPrice)
  const paymentTokenBalance = Number(useTokenBalance(account, idoData?.paymentToken)?.toSignificant())
  let maxBuy

  if (!freeOpen) {
    if (paymentTokenBalance <= estimatedSwapAmount) {
      maxBuy = paymentTokenBalance
    } else {
      maxBuy = estimatedSwapAmount
    }
  } else {
    if (paymentTokenBalance <= 2500) {
      maxBuy = paymentTokenBalance
    } else {
      maxBuy = 2500
    }
  }
  console.log(maxBuy);
  console.log(depositValue);


  const { i18n } = useLingui()


  const addTransaction = useTransactionAdder()
  const { buy } = useIdoSc(AUTHTRAIL_IDO[chainId])
  const [radioLock, setRadioLock] = useState("0")

  const getModalContent = () => (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxWidth={500}
      border={false}
      background={'#0C1A4A'}
    >
      <ModalHeader title={i18n._(t`Enter amount to buy`)} onClose={onDismiss} />
      <div className="wrapper flex-col items-center justify-center mx-5" style={{ marginBottom: 20 }}>
        <div className="flex-col items-center justify-center mt-5">          
          {account && (
            <div className="mb-2 text-left flex justify-between">
              <div className="text-aqua font-bold">
                {idoData?.paymentToken.symbol}
                <span className="text-white font-normal" style={{ marginLeft: 2 }}>
                  Balance
                </span>
              </div>
              <div className="text-aqua">
                {formatNumber(paymentTokenBalance)}
              </div>
            </div>
          )}

          <div className="relative flex items-center mb-5">
            <NumericalInput
              className="px-4 py-4 pr-20 bg-deepCove focus:ring focus:ring-lightBlueSecondary placeholder text-jordyBlue"
              value={depositValue}
              onUserInput={setDepositValue}
            />
            {account && (
              <Button
                variant="outlined"
                color="white"
                size="xs"
                onClick={() => {
                  setDepositValue(maxBuy.toString())
                }}
                style={{ borderRadius: 2 }}
                className="absolute border-0 right-4 focus:ring focus:ring-light-purple bg-royalBlue text-white"
              >
                {i18n._(t`MAX`)}
              </Button>
            )}
          </div>          
        </div>
        <div className="bg-deepCove p-3 text-white mt-3" style={{ fontSize: 12, marginBottom: "15px" }}>
          By purchasing you agree that you will receive the tokens according to the Community Round vesting schedule. 12-month vesting schedule with a 3-month cliff and equal vesting in months 4 – 12. More information is available <a href={"https://medium.com/beamswap/how-to-participate-in-authtrails-launch-on-beamswap-docks-e735f83d6400#:~:text=lock%2Dup%3A%20%2B50%25-,Authtrail%20tokenomics,-Authtrail%20token%3A%20AUT"} target={"_blank"} rel={"noreferrer"} className="text-aqua">here</a>
        </div>
        <div
          className="bg-linear-gradient text-center text-white mt-6 cursor-pointer"
          style={pendingTx ? { pointerEvents: 'none', opacity: '0.7', lineHeight: '45px' } : { lineHeight: '45px' }}
          onClick={async () => {
            setPendingTx(true)
            try {
            
              
              const buyAmount = ethers.utils.parseUnits(depositValue, "6")
              console.log(buyAmount.toString());
              const tx = await buy(buyAmount)
              await tx.wait()
              addTransaction(tx, {
                summary: `Bought AUT with ${depositValue} USDC`,
              })
              onDismiss()
            } catch (error) {
              console.error(error)
              setPendingTx(false)
            }
            setPendingTx(false)
          }}
        >
          {pendingTx && <Dots>Buying</Dots>}
          {!pendingTx && <>Buy AUT with USDC</>}
        </div>
      </div>
    </Modal>
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      {getModalContent()}
    </Modal>
  )
}

export default React.memo(BuyModal)
