import React, { useState, useContext } from 'react'
import { formatBalance, formatNumber, formatNumberScale, formatPercent } from '../../functions'
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

interface IdoModalProps {
  isOpen: boolean
  onDismiss: () => void
  onClose: () => void
}

const RegisterModal: React.FC<IdoModalProps> = ({ isOpen, onDismiss }) => {
  const { account, chainId } = useActiveWeb3React()

  const [view, setView] = useState('about')
  const [pendingTx, setPendingTx] = useState(false)
  const [lockTime, setLockTime] = useState("0") //  0 for no lock, 1 for 7 days, 2 for 30 days

  const [data, idoExists, idoChainId] = useIdoData(AUTHTRAIL_IDO[chainId])
 /* const [totalRaised, saleOpen, claimOpen, canContribute, freeOpen, registrationOpen, raiseCap] = getIdoData(
    AUTHTRAIL_IDO[chainId],
    parseInt(chainId.toString()),
    idoData?.paymentToken?.decimals,
    idoData?.version
  )*/
  const [idoDataOptimized] = getIdoDataOptimized(
    AUTHTRAIL_IDO[chainId]
  )

  const saleOpen:boolean =idoDataOptimized?idoDataOptimized?.saleOpen:false
  const registrationOpen:boolean = idoDataOptimized?idoDataOptimized?.registrationOpen:false
  const typedDepositValue = tryParseAmount('900000000000000000000000', useToken(SHARE_ADDRESS[chainId]))
  const [approvalState, approve] = useApproveCallback(typedDepositValue, AUTHTRAIL_IDO[chainId])
  const { register } = useIdoSc(AUTHTRAIL_IDO[chainId])
  /*const [tokenAmount, buyAmount, claimAmount, whiteListed, claimed, unlockTime, stakedBalance, tier, lockedTime] = getUserData(
    AUTHTRAIL_IDO[chainId],
    parseInt(idoChainId.toString()),
    account
  )*/
  const [userDataOptimized] = getUserDataOptimized(AUTHTRAIL_IDO[chainId]);
  const whiteListed:boolean = userDataOptimized?userDataOptimized?.whiteListed:false

  const addTransaction = useTransactionAdder()
  const userShareBalance = useTokenBalance(account, useToken(SHARE_ADDRESS[chainId]))
  const { i18n } = useLingui()

  let tier;
  if (Number(userShareBalance?.toSignificant()) < 200000) {
    tier = 1;
  } else if (Number(userShareBalance?.toSignificant()) >= 200000 && Number(userShareBalance?.toSignificant()) < 800000) {
    tier = 2;
  } else {
    tier = 3
  }
  const [radioLock, setRadioLock] = useState("0")

  const getModalContent = () => (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxWidth={500}
      border={false}
      background={'#0C1A4A'}
    >
      <ModalHeader title={i18n._(t`Select Lock and Register`)} onClose={onDismiss} />
      <div className="text-white w-full text-center mt-2 mb-2">Current Tier: {tier}</div>
      <div className="mb-8">
        <div id="form-wrapper">
          <form action="/p/quote.php" method="GET">
            <div id="debt-amount-slider">
              <input type="radio" name="debt-amount" id="1" value="1" required onClick={() => { setRadioLock("0") }} />
              <label data-debt-amount="No Lock" className='text-white' htmlFor='1'></label>
              <input type="radio" name="debt-amount" id="2" value="2" required onClick={() => { setRadioLock("1") }} />
              <label data-debt-amount="7 Days" className='text-white' htmlFor='2'></label>
              <input type="radio" name="debt-amount" id="3" value="3" required onClick={() => { setRadioLock("2") }} />
              <label data-debt-amount="30 days" className='text-white' htmlFor='3'></label>
              <div id="debt-amount-pos"></div>
            </div>
          </form>
        </div>
      </div>


      <div className="space-y-4 mx-5 my-5">
        {approvalState === ApprovalState.NOT_APPROVED && registrationOpen && !whiteListed && parseInt(radioLock) > 0 && Number(userShareBalance?.toSignificant()) >= 100000 && (
          <div
            className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
            style={saleOpen ? { pointerEvents: 'none', opacity: '0.7', lineHeight: '45px' } : { lineHeight: '45px' }}
            onClick={() => {
              approve()
            }}
          >
            Approve To Lock
          </div>
        )}
        {approvalState === ApprovalState.PENDING && registrationOpen && !whiteListed && parseInt(radioLock) > 0 && Number(userShareBalance?.toSignificant()) >= 100000 && (
          <div
            className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
            style={{ pointerEvents: 'none', opacity: '0.7', lineHeight: '45px' }}

          >
            <Dots>{i18n._(t`Approving`)}</Dots>
          </div>
        )}
        {approvalState === ApprovalState.APPROVED && registrationOpen && !whiteListed && parseInt(radioLock) > 0 && Number(userShareBalance?.toSignificant()) >= 100000 && (
          <div
            className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
            style={pendingTx ? { pointerEvents: 'none', opacity: '0.7', lineHeight: '45px' } : { lineHeight: '45px' }}
            onClick={async () => {

              setPendingTx(true)
              try {

                const tx = await register(radioLock)
                await tx.wait()
                addTransaction(tx, {
                  summary: `Registered for Authtrail`,
                })
              } catch (error) {
                console.error(error)
                setPendingTx(false)
                onDismiss()
              }
              setPendingTx(false)
            }}
          >
            {pendingTx && (
              <Dots>{i18n._(t`Applying`)}</Dots>
            )}
            {!pendingTx && (
              "Apply Now"
            )}
          </div>
        )}
        <div className="bg-deepCove p-3 text-white mt-3" style={{ fontSize: 12, marginBottom: "15px" }}>
          Note: Restricted countries are: United States, Canada, Afghanistan, Central African Republic, Congo-Brazzaville, Congo-Kinshasa, Cuba, Eritrea, Guinea-Bissau, Iran, Iraq, Lebanon, Libya, North Korea, Namibia, Mali, Somalia, South Sudan, Sudan, Venezuela, Yemen, Syria and Tajikistan.
        </div>
        {registrationOpen && !whiteListed && parseInt(radioLock) == 0 && Number(userShareBalance?.toSignificant()) >= 100000 && (
          <div
            className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
            style={pendingTx ? { pointerEvents: 'none', opacity: '0.7', lineHeight: '45px' } : { lineHeight: '45px' }}
            onClick={async () => {

              setPendingTx(true)
              try {

                const tx = await register(radioLock)
                await tx.wait()
                addTransaction(tx, {
                  summary: `Registered for Authtrail`,
                })
              } catch (error) {
                console.error(error)
                setPendingTx(false)
                onDismiss()
              }
              setPendingTx(false)
            }}
          >
            {pendingTx && (
              <Dots>{i18n._(t`Applying`)}</Dots>
            )}
            {!pendingTx && (
              "Apply Now"
            )}

          </div>
        )}

      </div>

    </Modal>
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      {getModalContent()}
    </Modal>
  )
}

export default React.memo(RegisterModal)
